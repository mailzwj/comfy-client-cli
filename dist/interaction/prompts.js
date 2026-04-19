/**
 * CLI 交互组件
 */
import inquirer from 'inquirer';
import { ParameterType } from '../workflow/types.js';
// ==================== 交互提示 ====================
export class InteractionPrompts {
    /**
     * 收集工作流注册信息
     */
    async promptWorkflowInfo(defaultName, defaultDescription) {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'name',
                message: '请输入工作流名称:',
                default: defaultName,
                validate: (input) => input.trim().length > 0 || '名称不能为空',
            },
            {
                type: 'input',
                name: 'description',
                message: '请输入工作流描述（可选）:',
                default: defaultDescription,
            },
        ]);
        return answers;
    }
    /**
     * 收集参数默认值
     */
    async promptParameterDefaults(parameters) {
        const questions = parameters.map((param) => this.createParameterQuestion(param, true));
        const answers = await inquirer.prompt(questions);
        return answers;
    }
    /**
     * 收集运行参数
     */
    async promptRunParameters(parameters, useDefaults = false) {
        const questions = parameters.map((param) => this.createParameterQuestion(param, false, useDefaults));
        const answers = await inquirer.prompt(questions);
        return answers;
    }
    /**
     * 创建工作流选择提示
     */
    async selectWorkflow(workflows) {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'workflowId',
                message: '请选择工作流:',
                choices: workflows,
            },
        ]);
        return answers.workflowId;
    }
    /**
     * 确认操作
     */
    async confirm(message, defaultValue = true) {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message,
                default: defaultValue,
            },
        ]);
        return answers.confirmed;
    }
    /**
     * 创建参数问题的辅助方法
     */
    createParameterQuestion(param, isSettingDefault, useDefaults = false) {
        const message = isSettingDefault
            ? `请输入 ${param.name} 的默认值:`
            : `${param.name}:`;
        if (useDefaults) {
            // 快速模式，不显示提示直接使用默认值
            return {
                type: 'input',
                name: param.id,
                message: `${param.name}:`,
                default: param.defaultValue,
            };
        }
        switch (param.type) {
            case ParameterType.SELECT:
                return {
                    type: 'list',
                    name: param.id,
                    message,
                    choices: param.options || [],
                    default: param.defaultValue,
                };
            case ParameterType.BOOLEAN:
                return {
                    type: 'confirm',
                    name: param.id,
                    message,
                    default: param.defaultValue ?? false,
                };
            case ParameterType.NUMBER:
                return {
                    type: 'number',
                    name: param.id,
                    message: `${message} (${param.min ?? '-'} - ${param.max ?? '-'}):`,
                    default: param.defaultValue,
                    filter: (value) => {
                        if (param.min !== undefined && value < param.min) {
                            return param.min;
                        }
                        if (param.max !== undefined && value > param.max) {
                            return param.max;
                        }
                        return value;
                    },
                };
            case ParameterType.TEXT:
            default:
                const question = {
                    type: 'input',
                    name: param.id,
                    message,
                    default: param.defaultValue,
                };
                if (param.required) {
                    question.validate = (input) => input.trim().length > 0 || `${param.name} 不能为空`;
                }
                return question;
        }
    }
}
// 导出单例
export const interactionPrompts = new InteractionPrompts();
//# sourceMappingURL=prompts.js.map