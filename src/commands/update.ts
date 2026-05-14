import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { getWorkflow, updateWorkflow } from "../store.js";
import { loadWorkflowFile, extractParams } from "../workflow.js";
import { WorkflowParam } from "../types.js";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update <workflow-id>")
    .description("更新工作流配置")
    .option("-n, --name <name>", "新的工作流名称")
    .option("-d, --description <desc>", "新的工作流描述")
    .option("-p, --params", "更新参数默认值")
    .action(
      async (
        workflowId: string,
        options: { name?: string; description?: string; params?: boolean }
      ) => {
        const workflow = getWorkflow(workflowId);

        if (!workflow) {
          console.error(chalk.red(`✗ 未找到工作流: ${workflowId}`));
          process.exit(1);
        }

        const updates: Partial<typeof workflow> = {};

        if (options.name) {
          updates.name = options.name;
        }

        if (options.description !== undefined) {
          updates.description = options.description;
        }

        if (!options.name && !options.description && !options.params) {
          // 交互模式
          const answers = await inquirer.prompt([
            {
              type: "input",
              name: "name",
              message: "工作流名称：",
              default: workflow.name,
            },
            {
              type: "input",
              name: "description",
              message: "工作流描述：",
              default: workflow.description || "",
            },
            {
              type: "confirm",
              name: "updateParams",
              message: "是否更新参数？",
              default: false,
            },
          ]);
          updates.name = answers.name;
          updates.description = answers.description;
          options.params = answers.updateParams;
        }

        if (options.params) {
          let workflowData;
          try {
            workflowData = loadWorkflowFile(workflow.filePath);
          } catch {
            console.error(chalk.red("✗ 无法加载工作流文件"));
            process.exit(1);
          }

          const detectedParams = extractParams(workflowData);
          const updatedParams: WorkflowParam[] = [];

          for (const param of detectedParams) {
            const existing = workflow.params.find(
              (p) => p.nodeId === param.nodeId && p.field === param.field
            );

            const { include } = await inquirer.prompt([
              {
                type: "confirm",
                name: "include",
                message: `绑定参数 ${chalk.yellow(param.label)}？`,
                default: !!existing,
              },
            ]);

            if (!include) continue;

            const { defaultValue, customLabel } = await inquirer.prompt([
              {
                type: "input",
                name: "customLabel",
                message: "参数显示名称：",
                default: existing?.label || param.label,
              },
              {
                type: "input",
                name: "defaultValue",
                message: "默认值：",
                default: String(existing?.defaultValue ?? param.defaultValue),
              },
            ]);

            updatedParams.push({
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

          updates.params = updatedParams;
        }

        const success = updateWorkflow(workflowId, updates);
        if (success) {
          console.log(chalk.green("\n✓ 工作流更新成功!\n"));
        } else {
          console.error(chalk.red("✗ 更新失败"));
        }
      }
    );
}
