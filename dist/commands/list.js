import chalk from "chalk";
import Table from "cli-table3";
import { loadStore } from "../store.js";
export function registerListCommand(program) {
    program
        .command("list")
        .alias("ls")
        .description("列出所有已注册的工作流")
        .option("-j, --json", "以 JSON 格式输出")
        .action((options) => {
        const store = loadStore();
        if (options.json) {
            console.log(JSON.stringify(store.workflows, null, 2));
            return;
        }
        if (store.workflows.length === 0) {
            console.log(chalk.yellow("\n暂无已注册的工作流"));
            console.log(chalk.dim("  使用 ccc add <workflow-file> 注册工作流\n"));
            return;
        }
        console.log();
        const table = new Table({
            head: [
                chalk.bold("ID"),
                chalk.bold("名称"),
                chalk.bold("描述"),
                chalk.bold("参数数量"),
                chalk.bold("更新时间"),
            ],
            colWidths: [12, 24, 28, 10, 22],
            style: { head: [], border: ["gray"] },
        });
        for (const wf of store.workflows) {
            table.push([
                chalk.bold(wf.id),
                wf.name,
                chalk.dim(wf.description || "—"),
                chalk.cyan(String(wf.params.length)),
                chalk.dim(new Date(wf.updatedAt).toLocaleString("zh-CN")),
            ]);
        }
        console.log(table.toString());
        console.log(chalk.dim(`\n共 ${store.workflows.length} 个工作流\n`));
        console.log(chalk.dim("提示：使用 ccc view <id> 查看工作流详情和可配置参数\n"));
    });
}
//# sourceMappingURL=list.js.map