/**
 * run 命令 - 运行工作流
 */

import { Command } from 'commander';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { Parameter, ParameterType, HistoryItem } from '../workflow/types.js';
import { workflowRegistry } from '../storage/registry.js';
import { ComfyUIClient } from '../client/comfyui-client.js';
import { interactionPrompts } from '../interaction/prompts.js';

// ==================== run 命令 ====================

export function runCommand(program: Command): void {
  program
    .command('run <workflow-id>')
    .description('运行工作流')
    .option('-o, --output <path>', '输出目录', './output')
    .option('-y, --yes', '跳过交互，使用默认值')
    .option('-s, --server <url>', 'ComfyUI 服务器地址', 'http://127.0.0.1:8188')
    .action(async (workflowId: string, options: any) => {
      // 1. 获取工作流
      const workflow = await workflowRegistry.get(workflowId);

      if (!workflow) {
        console.error(chalk.red('\n✗ 错误：找不到工作流'));
        console.error(chalk.yellow(`  ID: ${workflowId}`));
        console.error('');
        console.error(chalk.yellow('💡 提示：使用 "ccc list" 查看已注册的工作流'));
        process.exit(1);
      }

      // 2. 检查 ComfyUI 服务器
      const client = new ComfyUIClient({ baseUrl: options.server });
      const spinner = ora('检查 ComfyUI 服务器...').start();

      try {
        const isHealthy = await client.healthCheck();
        if (!isHealthy) {
          spinner.fail('无法连接到 ComfyUI 服务器');
          console.error(chalk.red('\n✗ 错误：无法连接到 ComfyUI 服务器'));
          console.error(chalk.yellow(`  地址：${options.server}`));
          console.error('');
          console.error(chalk.yellow('💡 提示:'));
          console.error(chalk.white('  1. 确保 ComfyUI 服务器正在运行'));
          console.error(chalk.white('  2. 检查服务器地址是否正确'));
          console.error(chalk.white('  3. 使用 --server 选项指定服务器地址'));
          process.exit(1);
        }
        spinner.succeed('ComfyUI 服务器连接正常');
      } catch (error) {
        spinner.fail('连接 ComfyUI 服务器失败');
        console.error(chalk.red('\n✗ 错误：'), error);
        process.exit(1);
      }

      // 3. 收集用户输入
      console.log('');
      console.log(chalk.cyan(`📋 工作流：${workflow.name}`));
      if (workflow.description) {
        console.log(chalk.gray(`   ${workflow.description}`));
      }
      console.log('');

      const answers = await interactionPrompts.promptRunParameters(
        workflow.parameters,
        options.yes
      );

      // 4. 替换工作流中的参数
      spinner.start('准备工作流...');
      const workflowJson = replaceParameters(
        workflow.workflowJson,
        workflow.parameters,
        answers
      );
      spinner.succeed('工作流准备完成');

      // 5. 提交到 ComfyUI
      spinner.start('提交任务到 ComfyUI...');
      const promptId = await client.submitPrompt(workflowJson);
      spinner.succeed('任务已提交!');

      console.log(chalk.cyan(`  任务 ID: ${promptId}`));
      console.log('');

      // 6. 等待完成
      spinner.text = '正在生成中...';
      const result = await client.waitForCompletion(promptId);
      spinner.succeed('生成完成!');

      // 7. 下载结果
      const outputDir = path.resolve(options.output);
      spinner.start(`正在下载结果到 ${outputDir}...`);
      await client.downloadOutputs(result, outputDir);
      spinner.succeed('结果下载完成!');

      // 8. 显示结果
      console.log('');
      console.log(chalk.green('✓ 工作流执行成功!'));
      console.log(chalk.cyan(`  输出目录：${outputDir}`));

      // 统计生成的图像数量
      let imageCount = 0;
      for (const nodeOutput of Object.values(result.outputs)) {
        imageCount += nodeOutput.images?.length || 0;
      }
      if (imageCount > 0) {
        console.log(chalk.cyan(`  生成图像：${imageCount} 张`));
      }

      client.disconnectWebSocket();
    });
}

// ==================== 辅助函数 ====================

/**
 * 替换工作流中的参数值
 */
function replaceParameters(
  workflowJson: Record<string, any>,
  parameters: Parameter[],
  answers: Record<string, any>
): Record<string, any> {
  // 深拷贝工作流 JSON
  const result = JSON.parse(JSON.stringify(workflowJson));

  for (const param of parameters) {
    const nodeId = param.nodeId;
    const inputName = param.inputName;
    let value = answers[param.id];

    if (result[nodeId]?.inputs) {
      // 处理模板变量
      if (param.template && typeof value === 'string') {
        result[nodeId].inputs[inputName] = evaluateTemplate(
          param.template,
          answers
        );
      } else {
        result[nodeId].inputs[inputName] = value;
      }
    }
  }

  return result;
}

/**
 * 计算模板字符串
 */
function evaluateTemplate(
  template: string,
  values: Record<string, any>
): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
    return values[key] ?? '';
  });
}
