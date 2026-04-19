/**
 * add 命令 - 注册新的工作流
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { ParameterExtractor } from '../workflow/parameter-extractor.js';
import { workflowRegistry } from '../storage/registry.js';
import { interactionPrompts } from '../interaction/prompts.js';
// ==================== add 命令 ====================
export function addCommand(program) {
    program
        .command('add <workflow-file>')
        .description('注册新的工作流')
        .option('-n, --name <name>', '工作流名称')
        .option('-d, --description <desc>', '工作流描述')
        .action(async (workflowFile, options) => {
        const spinner = ora('正在注册工作流...').start();
        try {
            // 1. 读取工作流文件
            spinner.text = '读取工作流文件...';
            const absolutePath = path.resolve(workflowFile);
            try {
                await fs.access(absolutePath);
            }
            catch {
                console.error(chalk.red('\n✗ 错误：工作流文件不存在'));
                console.error(chalk.yellow(`  路径：${absolutePath}`));
                process.exit(1);
            }
            const workflowContent = await fs.readFile(absolutePath, 'utf-8');
            let workflowJson;
            try {
                workflowJson = JSON.parse(workflowContent);
            }
            catch (error) {
                console.error(chalk.red('\n✗ 错误：无效的 JSON 文件'));
                process.exit(1);
            }
            // 2. 提取可配置参数
            spinner.text = '提取可配置参数...';
            const extractor = new ParameterExtractor();
            const extractedParams = extractor.extract(workflowJson);
            if (extractedParams.length === 0) {
                console.warn(chalk.yellow('\n⚠ 警告：未检测到可配置参数，工作流可能无法交互式运行'));
            }
            // 3. 交互获取信息
            spinner.text = '收集工作流信息...';
            const { name, description } = await interactionPrompts.promptWorkflowInfo(options.name || path.basename(workflowFile, '.json'), options.description || '');
            // 4. 收集参数默认值
            if (extractedParams.length > 0) {
                spinner.text = '设置参数默认值...';
                const defaults = await interactionPrompts.promptParameterDefaults(extractedParams);
                // 应用默认值
                extractedParams.forEach((param) => {
                    if (defaults[param.id] !== undefined) {
                        param.defaultValue = defaults[param.id];
                    }
                });
            }
            // 5. 构建工作流配置
            spinner.text = '保存工作流...';
            const workflowConfig = {
                name,
                description,
                sourceFile: absolutePath,
                workflowJson,
                parameters: extractedParams,
                nodes: [], // 暂不存储节点配置
            };
            // 6. 保存到注册表
            const savedWorkflow = await workflowRegistry.save(workflowConfig);
            spinner.succeed('工作流注册成功!');
            // 显示结果
            console.log('');
            console.log(chalk.green('✓ 工作流信息:'));
            console.log(chalk.cyan(`  ID:         ${savedWorkflow.id}`));
            console.log(chalk.cyan(`  名称：       ${savedWorkflow.name}`));
            if (savedWorkflow.description) {
                console.log(chalk.cyan(`  描述：       ${savedWorkflow.description}`));
            }
            console.log(chalk.cyan(`  参数数量：   ${savedWorkflow.parameters.length}`));
            console.log(chalk.cyan(`  存储位置：   ${path.dirname(savedWorkflow.sourceFile)}`));
            console.log('');
            console.log(chalk.yellow('💡 提示:'));
            console.log(chalk.white(`  运行此工作流：ccc run ${savedWorkflow.id}`));
            console.log(chalk.white(`  查看工作流列表：ccc list`));
        }
        catch (error) {
            spinner.fail('注册失败');
            console.error(chalk.red('\n✗ 错误:'), error);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=add.js.map