/**
 * update 命令 - 更新工作流配置
 */
import chalk from 'chalk';
import { workflowRegistry } from '../storage/registry.js';
import { interactionPrompts } from '../interaction/prompts.js';
import ora from 'ora';
// ==================== update 命令 ====================
export function updateCommand(program) {
    program
        .command('update <workflow-id>')
        .description('更新工作流配置')
        .option('-n, --name <name>', '新的工作流名称')
        .option('-d, --description <desc>', '新的工作流描述')
        .option('-p, --params', '更新参数默认值')
        .action(async (workflowId, options) => {
        // 1. 获取工作流
        const workflow = await workflowRegistry.get(workflowId);
        if (!workflow) {
            console.error(chalk.red('\n✗ 错误：找不到工作流'));
            console.error(chalk.yellow(`  ID: ${workflowId}`));
            process.exit(1);
        }
        const updates = {};
        // 2. 更新基本信息（仅在显式传入 --name 或未传 --params 时才触发）
        if (options.name) {
            updates.name = options.name;
            if (options.description !== undefined) {
                updates.description = options.description;
            }
        }
        else if (!options.params) {
            // 没有传任何选项时，交互式修改名称和描述
            const answers = await interactionPrompts.promptWorkflowInfo(workflow.name, workflow.description || '');
            updates.name = answers.name;
            updates.description = answers.description;
        }
        // 3. 更新参数默认值（停止 spinner 后再交互）
        if (options.params) {
            const newDefaults = await interactionPrompts.promptParameterDefaults(workflow.parameters);
            // 更新参数默认值
            const updatedParams = workflow.parameters.map((param) => ({
                ...param,
                defaultValue: newDefaults[param.id] ?? param.defaultValue,
            }));
            updates.parameters = updatedParams;
        }
        // 4. 保存更新
        const spinner = ora('保存更新...').start();
        const updatedWorkflow = await workflowRegistry.update(workflowId, updates);
        if (!updatedWorkflow) {
            spinner.fail('更新失败');
            console.error(chalk.red('\n✗ 错误：更新工作流失败'));
            process.exit(1);
        }
        spinner.succeed('工作流更新成功!');
        // 5. 显示更新内容
        console.log('');
        console.log(chalk.green('✓ 更新内容:'));
        if (updates.name && updates.name !== workflow.name) {
            console.log(chalk.cyan(`  名称：${workflow.name} → ${updates.name}`));
        }
        if (updates.description !== undefined) {
            const oldDesc = workflow.description || '(无)';
            const newDesc = updates.description || '(无)';
            if (oldDesc !== newDesc) {
                console.log(chalk.cyan(`  描述：${oldDesc} → ${newDesc}`));
            }
        }
        if (options.params) {
            console.log(chalk.cyan(`  参数：已更新 ${workflow.parameters.length} 个参数的默认值`));
        }
        console.log('');
        console.log(chalk.yellow('💡 提示:'));
        console.log(chalk.white(`  运行更新后的工作流：ccc run ${workflowId}`));
    });
}
//# sourceMappingURL=update.js.map
