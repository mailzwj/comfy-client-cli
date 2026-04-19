#!/usr/bin/env node

/**
 * ComfyUI CLI - 命令行工具
 * 
 * 管理、配置和运行 ComfyUI 工作流
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

// 导入命令
import { addCommand } from './commands/add.js';
import { runCommand } from './commands/run.js';
import { listCommand } from './commands/list.js';
import { updateCommand } from './commands/update.js';
import { deleteCommand } from './commands/delete.js';

// 读取 package.json 获取版本信息
const packageJsonPath = path.join(import.meta.dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// 创建 CLI 程序
const program = new Command();

program
  .name('ccc')
  .description('ComfyUI 命令行工具 - 管理、配置和运行工作流')
  .version(packageJson.version || '1.0.0');

// 注册所有命令
addCommand(program);
runCommand(program);
listCommand(program);
updateCommand(program);
deleteCommand(program);

// 添加 help 命令的额外说明
program.addHelpText('after', `
${chalk.cyan('示例:')}
  $ ccc add workflow.json              注册新的工作流
  $ ccc run my-workflow                运行工作流
  $ ccc list                           列出所有工作流
  $ ccc update my-workflow --params    更新参数默认值
  $ ccc delete my-workflow             删除工作流

${chalk.cyan('资源:')} 
  文档：https://github.com/your-repo/comfy-client-cli
  问题反馈：https://github.com/your-repo/comfy-client-cli/issues
`);

// 解析命令行参数
program.parse();
