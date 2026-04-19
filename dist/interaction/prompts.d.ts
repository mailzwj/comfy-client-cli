/**
 * CLI 交互组件
 */
import type { Parameter } from '../workflow/types.js';
export declare class InteractionPrompts {
    /**
     * 收集工作流注册信息
     */
    promptWorkflowInfo(defaultName: string, defaultDescription: string): Promise<{
        name: string;
        description: string;
    }>;
    /**
     * 收集参数默认值
     */
    promptParameterDefaults(parameters: Parameter[]): Promise<Record<string, any>>;
    /**
     * 收集运行参数
     */
    promptRunParameters(parameters: Parameter[], useDefaults?: boolean): Promise<Record<string, any>>;
    /**
     * 创建工作流选择提示
     */
    selectWorkflow(workflows: Array<{
        name: string;
        value: string;
    }>): Promise<string>;
    /**
     * 确认操作
     */
    confirm(message: string, defaultValue?: boolean): Promise<boolean>;
    /**
     * 创建参数问题的辅助方法
     */
    private createParameterQuestion;
}
export declare const interactionPrompts: InteractionPrompts;
//# sourceMappingURL=prompts.d.ts.map