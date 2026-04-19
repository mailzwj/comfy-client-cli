/**
 * delete 命令 - 删除工作流
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { workflowRegistry } from '../storage/registry.js';
import { interactionPrompts } from '../interaction/prompts.js';

// ==================== delete 命令 ====================

export function deleteCommand(program: Command): void {
  program
    .command('delete <workflow-id>')
    .alias('rm')
    .description('删除工作流')
    .option('-y, --yes', '跳过确认')
    .action(async (workflowId: string, options: any) => {
      // 1. 获取工作流
      const workflow = await workflowRegistry.get(workflowId);

      if (!workflow) {
        console.error(chalk.red('\n✗ 错误：找不到工作流'));
        console.error(chalk.yellow(`  ID: ${workflowId}`));
        process.exit(1);
      }

      // 2. 确认删除
      if (!options.yes) {
        const confirmed = await interactionPrompts.confirm(
          chalk.yellow(`确定要删除工作流 "${workflow.name}" 吗？`),
          false
        );

        if (!confirmed) {
          console.log(chalk.gray('\n已取消删除'));
          return;
        }
      }

      // 3. 删除工作流
      const success = await workflowRegistry.delete(workflowId);

      if (success) {
        console.log(chalk.green('\n✓ 工作流已删除'));
        console.log(chalk.cyan(`  ID: ${workflowId}`));
        console.log(chalk.cyan(`  名称：${workflow.name}`));
      } else {
        console.error(chalk.red('\n✗ 删除失败'));
        process.exit(1);
      }
    });
}
