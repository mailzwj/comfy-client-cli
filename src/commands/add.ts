import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { addWorkflow, generateId } from "../store.js";
import { loadWorkflowFile, extractParams } from "../workflow.js";
import { WorkflowParam } from "../types.js";

export function registerAddCommand(program: Command): void {
  program
    .command("add <workflow-file>")
    .description("注册 ComfyUI 工作流文件")
    .option("-n, --name <name>", "工作流名称")
    .option("-d, --description <desc>", "工作流描述")
    .action(async (workflowFile: string, options: { name?: string; description?: string }) => {
      const filePath = path.resolve(workflowFile);

      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`✗ 文件不存在: ${filePath}`));
        process.exit(1);
      }

      let workflow;
      try {
        workflow = loadWorkflowFile(filePath);
      } catch {
        console.error(chalk.red("✗ 无法解析工作流 JSON 文件，请确认文件格式正确"));
        process.exit(1);
      }

      const detectedParams = extractParams(workflow!);

      console.log(chalk.cyan("\n📋 工作流基本信息\n"));

      // 询问工作流名称和描述
      const basicAnswers = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "请输入工作流名称：",
          default: options.name || path.basename(filePath, ".json"),
          when: !options.name,
        },
        {
          type: "input",
          name: "description",
          message: "请输入工作流描述（可选）：",
          when: !options.description,
        },
      ]);

      const name = options.name || basicAnswers.name;
      const description = options.description || basicAnswers.description || "";

      // 处理参数配置
      let params: WorkflowParam[] = [];

      if (detectedParams.length > 0) {
        console.log(chalk.cyan(`\n⚙️  检测到 ${detectedParams.length} 个可配置参数\n`));

        const { configureParams } = await inquirer.prompt([
          {
            type: "confirm",
            name: "configureParams",
            message: "是否配置参数默认值？",
            default: true,
          },
        ]);

        if (configureParams) {
          for (const param of detectedParams) {
            const { include } = await inquirer.prompt([
              {
                type: "confirm",
                name: "include",
                message: `是否绑定参数 ${chalk.yellow(param.label)}？`,
                default: true,
              },
            ]);

            if (!include) continue;

            const { defaultValue, customLabel } = await inquirer.prompt([
              {
                type: "input",
                name: "customLabel",
                message: `参数显示名称：`,
                default: param.label,
              },
              {
                type: "input",
                name: "defaultValue",
                message: `默认值（当前：${param.defaultValue}）：`,
                default: String(param.defaultValue),
              },
            ]);

            params.push({
              ...param,
              label: customLabel,
              defaultValue:
                param.type === "number"
                  ? Number(defaultValue)
                  : param.type === "boolean"
                  ? defaultValue === "true"
                  : defaultValue,
            });
          }
        }
      } else {
        console.log(chalk.yellow("\n⚠  未检测到标准可配置参数，工作流将使用原始配置运行\n"));
      }

      const id = generateId();
      const now = new Date().toISOString();

      addWorkflow({
        id,
        name,
        description,
        filePath,
        params,
        createdAt: now,
        updatedAt: now,
      });

      console.log(chalk.green("\n✓ 工作流注册成功!"));
      console.log(`  ${chalk.gray("ID:")}   ${chalk.bold(id)}`);
      console.log(`  ${chalk.gray("名称：")} ${chalk.bold(name)}`);
      if (description) console.log(`  ${chalk.gray("描述：")} ${description}`);
      console.log(`  ${chalk.gray("参数：")} ${params.length} 个可配置参数`);

      console.log(chalk.dim(`\n💡 提示：运行此工作流使用:`));
      console.log(chalk.dim(`  ccc run ${id}`));
      if (params.length > 0) {
        const exampleOpts = params
          .slice(0, 2)
          .map((p) => `--${p.nodeId}-${p.field} "值"`)
          .join(" ");
        console.log(chalk.dim(`  ccc run ${id} ${exampleOpts}`));
      }
      console.log();
    });
}
