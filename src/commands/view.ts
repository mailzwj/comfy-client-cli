import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import { getWorkflow } from "../store.js";
import { paramToOptionName } from "../workflow.js";

export function registerViewCommand(program: Command): void {
  program
    .command("view <workflow-id>")
    .description("查看指定工作流的详细信息（包括可配置参数）")
    .option("-j, --json", "以 JSON 格式输出")
    .action((workflowId: string, options: { json?: boolean }) => {
      const workflow = getWorkflow(workflowId);

      if (!workflow) {
        console.error(chalk.red(`✗ 未找到工作流: ${workflowId}`));
        console.log(chalk.dim("  使用 ccc list 查看所有已注册工作流"));
        process.exit(1);
      }

      if (options.json) {
        console.log(JSON.stringify(workflow, null, 2));
        return;
      }

      // 基本信息
      console.log();
      console.log(chalk.bold.cyan("━━━ 工作流信息 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
      console.log(`  ${chalk.gray("ID:")}     ${chalk.bold(workflow.id)}`);
      console.log(`  ${chalk.gray("名称：")}   ${chalk.bold(workflow.name)}`);
      if (workflow.description) {
        console.log(`  ${chalk.gray("描述：")}   ${workflow.description}`);
      }
      console.log(`  ${chalk.gray("文件：")}   ${chalk.dim(workflow.filePath)}`);
      console.log(`  ${chalk.gray("注册时间：")} ${new Date(workflow.createdAt).toLocaleString("zh-CN")}`);
      console.log(`  ${chalk.gray("更新时间：")} ${new Date(workflow.updatedAt).toLocaleString("zh-CN")}`);

      // 参数信息
      console.log();
      console.log(chalk.bold.cyan("━━━ 可配置参数 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));

      if (workflow.params.length === 0) {
        console.log(chalk.yellow("  （无绑定参数，工作流将使用原始配置运行）"));
      } else {
        const table = new Table({
          head: [
            chalk.bold("选项名"),
            chalk.bold("显示名称"),
            chalk.bold("类型"),
            chalk.bold("默认值"),
            chalk.bold("节点 ID"),
            chalk.bold("字段"),
          ],
          colWidths: [28, 24, 8, 20, 10, 16],
          style: { head: [], border: ["gray"] },
        });

        for (const param of workflow.params) {
          const optionName = `--${paramToOptionName(param)}`;
          table.push([
            chalk.green(optionName),
            param.label.split(" (")[0], // 仅显示名称部分，去掉节点信息
            chalk.cyan(param.type),
            chalk.yellow(String(param.defaultValue)),
            chalk.dim(param.nodeId),
            chalk.dim(param.field),
          ]);
        }

        console.log(table.toString());

        // 使用示例
        console.log();
        console.log(chalk.bold.cyan("━━━ 使用示例 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
        console.log();

        // 基本运行
        console.log(`  ${chalk.gray("# 交互式运行（逐一询问参数）")}`);
        console.log(`  ${chalk.bold("ccc run " + workflow.id)}\n`);

        // 使用默认值
        console.log(`  ${chalk.gray("# 快速运行（使用所有默认值）")}`);
        console.log(`  ${chalk.bold("ccc run " + workflow.id + " -y")}\n`);

        // 命令行传参示例
        const exampleArgs = workflow.params
          .slice(0, 3)
          .map((p) => {
            const optName = `--${paramToOptionName(p)}`;
            const exampleVal =
              p.type === "string"
                ? `"${p.defaultValue}"`
                : String(p.defaultValue);
            return `\\\n      ${optName} ${exampleVal}`;
          })
          .join(" ");

        if (workflow.params.length > 0) {
          console.log(`  ${chalk.gray("# 命令行直接传参（无需交互）")}`);
          console.log(`  ${chalk.bold(`ccc run ${workflow.id} ${exampleArgs}`)}\n`);
        }

        // 描述
        if (workflow.params.some((p) => p.description)) {
          console.log(chalk.bold.cyan("━━━ 参数说明 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
          for (const param of workflow.params) {
            if (param.description) {
              console.log(
                `  ${chalk.green("--" + paramToOptionName(param))}  ${chalk.dim(param.description)}`
              );
            }
          }
          console.log();
        }
      }

      console.log();
    });
}
