/**
 * list 命令 - 列出已注册的工作流
 */
import chalk from 'chalk';
import Table from 'cli-table3';
import { workflowRegistry } from '../storage/registry.js';
// ==================== list 命令 ====================
export function listCommand(program) {
    program
        .command('list')
        .alias('ls')
        .description('列出已注册的工作流')
        .option('-j, --json', '以 JSON 格式输出')
        .action(async (options) => {
        try {
            const workflows = await workflowRegistry.list();
            if (workflows.length === 0) {
                if (options.json) {
                    console.log('[]');
                    return;
                }
                console.log(chalk.yellow('\n⚠ 没有已注册的工作流'));
                console.log('');
                console.log(chalk.yellow('💡 提示:'));
                console.log(chalk.white('  使用 "ccc add <workflow.json>" 注册工作流'));
                return;
            }
            if (options.json) {
                // JSON 格式输出
                console.log(JSON.stringify(workflows.map((w) => ({
                    id: w.id,
                    name: w.name,
                    description: w.description,
                    parameters: w.parameters.length,
                    createdAt: w.createdAt,
                    updatedAt: w.updatedAt,
                })), null, 2));
                return;
            }
            // 表格格式输出
            console.log(chalk.cyan('\n已注册的工作流:\n'));
            const table = new Table({
                head: [
                    chalk.cyan('ID'),
                    chalk.cyan('名称'),
                    chalk.cyan('参数'),
                    chalk.cyan('更新时间'),
                ],
            });
            for (const workflow of workflows) {
                const updatedAt = new Date(workflow.updatedAt);
                const dateStr = `${updatedAt.getFullYear()}-${String(updatedAt.getMonth() + 1).padStart(2, '0')}-${String(updatedAt.getDate()).padStart(2, '0')} ${String(updatedAt.getHours()).padStart(2, '0')}:${String(updatedAt.getMinutes()).padStart(2, '0')}`;
                table.push([
                    workflow.id,
                    workflow.name,
                    workflow.parameters.length,
                    dateStr,
                ]);
            }
            console.log(table.toString());
            console.log('');
            console.log(chalk.gray(`共 ${workflows.length} 个工作流`));
            console.log('');
            console.log(chalk.yellow('💡 提示:'));
            console.log(chalk.white('  运行工作流：ccc run <workflow-id>'));
            console.log(chalk.white('  删除工作流：ccc delete <workflow-id>'));
        }
        catch (error) {
            console.error(chalk.red('\n✗ 错误:'), error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=list.js.map