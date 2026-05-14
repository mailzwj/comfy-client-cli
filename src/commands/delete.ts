import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { getWorkflow, deleteWorkflow } from "../store.js";

export function registerDeleteCommand(program: Command): void {
  program
    .command("delete <workflow-id>")
    .description("删除已注册的工作流")
    .option("-y, --yes", "跳过确认")
    .action(async (workflowId: string, options: { yes?: boolean }) => {
      const workflow = getWorkflow(workflowId);

      if (!workflow) {
        console.error(chalk.red(`✗ 未找到工作流: ${workflowId}`));
        process.exit(1);
      }

      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: `确认删除工作流 "${workflow.name}" (${workflowId})？`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.dim("已取消"));
          return;
        }
      }

      deleteWorkflow(workflowId);
      console.log(chalk.green(`\n✓ 已删除工作流: ${workflow.name}\n`));
    });
}
