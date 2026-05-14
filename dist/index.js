#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { registerAddCommand } from "./commands/add.js";
import { registerRunCommand } from "./commands/run.js";
import { registerListCommand } from "./commands/list.js";
import { registerViewCommand } from "./commands/view.js";
import { registerUpdateCommand } from "./commands/update.js";
import { registerDeleteCommand } from "./commands/delete.js";
const program = new Command();
program
    .name("ccc")
    .description(chalk.cyan("🚀 ComfyUI CLI") +
    chalk.dim(" - 轻松管理、配置和运行 ComfyUI 工作流"))
    .version("1.1.0");
// 注册所有命令
registerAddCommand(program);
registerRunCommand(program);
registerListCommand(program);
registerViewCommand(program);
registerUpdateCommand(program);
registerDeleteCommand(program);
program.parse(process.argv);
//# sourceMappingURL=index.js.map