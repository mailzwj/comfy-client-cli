/**
 * 工作流参数提取器
 * 从 ComfyUI 工作流 JSON 中提取可配置的参数
 */
import type { Parameter } from './types.js';
export declare class ParameterExtractor {
    /**
     * 需要监控的节点类型
     */
    private readonly targetNodes;
    /**
     * 从工作流 JSON 中提取可配置参数
     */
    extract(workflowJson: Record<string, any>): Parameter[];
    /**
     * 提取提示词参数
     */
    private extractPromptParams;
    /**
     * 提取 KSampler 参数
     */
    private extractKSamplerParams;
    /**
     * 提取潜空间尺寸参数
     */
    private extractLatentParams;
    /**
     * 提取检查点参数
     */
    private extractCheckpointParam;
    /**
     * 判断是否为负面提示词
     */
    private isNegativePrompt;
}
//# sourceMappingURL=parameter-extractor.d.ts.map