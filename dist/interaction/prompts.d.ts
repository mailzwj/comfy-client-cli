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
     * 自定义参数交互流程：引导用户从工作流中选择任意节点输入作为可配置参数
     */
    promptCustomParameters(workflowJson: Record<string, any>, existingParams: Parameter[]): Promise<Parameter[]>;
    /**
     * 选择工作流节点
     */
    private promptSelectNode;
    /**
     * 选择节点的输入参数（过滤连线和已有参数）
     */
    private promptSelectInput;
    /**
     * 收集自定义参数的属性信息
     */
    private promptCustomParamProperties;
    /**
     * 创建参数问题的辅助方法
     */
    private createParameterQuestion;
}
export declare const interactionPrompts: InteractionPrompts;
//# sourceMappingURL=prompts.d.ts.map
