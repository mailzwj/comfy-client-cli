import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { randomUUID } from "crypto";
import { getWorkflow } from "../store.js";
import { loadWorkflowFile, applyParams, paramToOptionName } from "../workflow.js";
import { queuePrompt, waitForCompletion, downloadOutputs, checkServerHealth } from "../api.js";
import { WorkflowParam } from "../types.js";

export function registerRunCommand(program: Command): void {
  const runCmd = program
    .command("run <workflow-id>")
    .description("运行工作流")
    .option("-o, --output <path>", "输出目录", "./output")
    .option("-y, --yes", "跳过交互，使用默认值")
    .option("-s, --server <url>", "ComfyUI 服务器地址", "http://127.0.0.1:8188");

  // 注意：动态参数需要在解析时处理，commander 不支持完全动态选项
  // 我们通过 allowUnknownOption + 手动解析来实现
  runCmd.allowUnknownOption(true);

  runCmd.action(async (workflowId: string, options: Record<string, string | boolean>, cmd: Command) => {
    const workflow = getWorkflow(workflowId);

    if (!workflow) {
      console.error(chalk.red(`✗ 未找到工作流: ${workflowId}`));
      console.log(chalk.dim("  使用 ccc list 查看所有已注册工作流"));
      process.exit(1);
      return;
    }

    // 解析未知参数（动态 --nodeId-field 格式）
    const rawArgs = process.argv.slice(3); // 跳过 node, script, "run"
    const cliParams = parseDynamicArgs(rawArgs, workflow.params);

    // 检查服务器连通性
    const serverUrl = (options.server as string) || "http://127.0.0.1:8188";
    const spinner = ora("正在连接 ComfyUI 服务器...").start();
    const healthy = await checkServerHealth(serverUrl);
    if (!healthy) {
      spinner.fail(chalk.red(`无法连接到服务器: ${serverUrl}`));
      process.exit(1);
    }
    spinner.succeed(chalk.green(`已连接到服务器: ${serverUrl}`));

    console.log(chalk.cyan(`\n📋 工作流：${workflow.name}`));
    if (workflow.description) console.log(chalk.gray(`   ${workflow.description}\n`));

    // 收集参数值
    const paramValues: Record<string, string | number | boolean> = {};

    if (workflow.params.length > 0) {
      const useDefaults = options.yes === true;

      for (const param of workflow.params) {
        const optionKey = paramToOptionName(param);

        // 优先使用命令行传入的值
        if (cliParams[optionKey] !== undefined) {
          paramValues[`${param.nodeId}.${param.field}`] = cliParams[optionKey];
          console.log(
            chalk.dim(`  ${param.label}: `) + chalk.green(String(cliParams[optionKey])) + chalk.dim(" (来自命令行)")
          );
          continue;
        }

        // 否则交互式询问或使用默认值
        if (useDefaults) {
          paramValues[`${param.nodeId}.${param.field}`] = param.defaultValue;
        } else {
          const answer = await promptForParam(param);
          paramValues[`${param.nodeId}.${param.field}`] = answer;
        }
      }
    }

    if (options.yes) {
      // 在 -y 模式下，列出使用的值
      if (workflow.params.length > 0) {
        console.log(chalk.dim("\n使用以下参数（默认值或命令行指定）："));
        for (const param of workflow.params) {
          const key = `${param.nodeId}.${param.field}`;
          const val = paramValues[key] ?? param.defaultValue;
          console.log(chalk.dim(`  ${param.label}: ${val}`));
        }
      }
    }

    // 加载工作流并应用参数
    let workflowData;
    try {
      workflowData = loadWorkflowFile(workflow.filePath);
    } catch {
      console.error(chalk.red(`✗ 无法加载工作流文件: ${workflow.filePath}`));
      console.error(chalk.dim("  文件可能已被移动或删除，请使用 ccc update 重新绑定文件路径"));
      process.exit(1);
    }

    const finalWorkflow = applyParams(workflowData, workflow.params, paramValues);

    // 提交任务
    const clientId = randomUUID();
    const submitSpinner = ora("正在提交任务到 ComfyUI...").start();

    let promptId = "";
    try {
      const response = await queuePrompt(serverUrl, finalWorkflow, clientId);
      promptId = response.prompt_id;
      submitSpinner.succeed(chalk.green(`任务已提交！ ID: ${promptId}`));
    } catch (err) {
      submitSpinner.fail(chalk.red("提交任务失败"));
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
      return;
    }

    // 等待生成完成
    const genSpinner = ora("正在生成中...").start();
    let progressText = "";

    try {
      await waitForCompletion(serverUrl, promptId, clientId, (value, max, nodeId) => {
        progressText = `节点 ${nodeId}: ${value}/${max}`;
        genSpinner.text = `正在生成中... ${chalk.dim(progressText)}`;
      });
      genSpinner.succeed(chalk.green("生成完成！"));
    } catch (err) {
      genSpinner.fail(chalk.red("生成过程中出错"));
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
      return;
    }

    // 下载输出文件
    const outputDir = (options.output as string) || "./output";
    const dlSpinner = ora("正在下载输出文件...").start();

    try {
      const files = await downloadOutputs(serverUrl, promptId, outputDir);
      dlSpinner.succeed(chalk.green(`工作流执行成功！`));
      console.log(chalk.dim(`  输出目录：${outputDir}`));
      console.log(chalk.dim(`  生成图像：${files.length} 张`));
      files.forEach((f) => console.log(chalk.dim(`    - ${f}`)));
    } catch (err) {
      dlSpinner.fail(chalk.red("下载输出文件失败"));
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    }

    console.log();
  });
}

async function promptForParam(param: WorkflowParam): Promise<string | number | boolean> {
  if (param.type === "boolean") {
    const { value } = await inquirer.prompt([
      {
        type: "confirm",
        name: "value",
        message: param.label,
        default: Boolean(param.defaultValue),
      },
    ]);
    return value as boolean;
  }

  const { value } = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message: `${param.label}${param.description ? chalk.dim(" (" + param.description + ")") : ""}：`,
      default: String(param.defaultValue),
    },
  ]);

  if (param.type === "number") {
    return Number(value);
  }
  return value as string;
}

/**
 * 手动解析动态参数
 * 格式：--nodeId-field value 或 --nodeId-field=value
 */
function parseDynamicArgs(
  args: string[],
  params: WorkflowParam[]
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  const validKeys = new Set(params.map((p) => paramToOptionName(p)));

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith("--")) continue;

    let key: string;
    let value: string | undefined;

    if (arg.includes("=")) {
      [key, value] = arg.slice(2).split("=");
    } else {
      key = arg.slice(2);
      if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        value = args[i + 1];
        i++;
      }
    }

    if (validKeys.has(key) && value !== undefined) {
      const param = params.find((p) => paramToOptionName(p) === key);
      if (param) {
        if (param.type === "number") {
          result[key] = Number(value);
        } else if (param.type === "boolean") {
          result[key] = value === "true" || value === "1";
        } else {
          result[key] = value;
        }
      }
    }
  }

  return result;
}
