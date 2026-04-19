/**
 * 工作流参数提取器
 * 从 ComfyUI 工作流 JSON 中提取可配置的参数
 */

import type { Parameter } from './types.js';
import { ParameterType } from './types.js';

// ==================== 参数提取器 ====================

export class ParameterExtractor {
  /**
   * 需要监控的节点类型
   */
  private readonly targetNodes = [
    'CLIPTextEncode',         // 提示词节点
    'KSampler',               // 采样器节点
    'KSamplerAdvanced',       // 高级采样器节点
    'EmptyLatentImage',       // 潜空间尺寸节点
    'CheckpointsLoaderSimple', // 检查点加载节点
    'VAEDecode',              // VAE 解码节点
  ];

  /**
   * 从工作流 JSON 中提取可配置参数
   */
  extract(workflowJson: Record<string, any>): Parameter[] {
    const parameters: Parameter[] = [];

    // 遍历所有节点
    for (const [nodeId, nodeData] of Object.entries(workflowJson)) {
      // 跳过非节点数据
      if (!nodeData.class_type) continue;

      const className = nodeData.class_type;

      // 只处理目标节点类型
      if (!this.targetNodes.includes(className)) continue;

      // 根据节点类型提取参数
      switch (className) {
        case 'CLIPTextEncode':
          parameters.push(...this.extractPromptParams(nodeId, nodeData));
          break;
        case 'KSampler':
        case 'KSamplerAdvanced':
          parameters.push(...this.extractKSamplerParams(nodeId, nodeData));
          break;
        case 'EmptyLatentImage':
          parameters.push(...this.extractLatentParams(nodeId, nodeData));
          break;
        case 'CheckpointsLoaderSimple':
          parameters.push(this.extractCheckpointParam(nodeId, nodeData));
          break;
      }
    }

    return parameters;
  }

  /**
   * 提取提示词参数
   */
  private extractPromptParams(
    nodeId: string,
    nodeData: any
  ): Parameter[] {
    const inputs = nodeData.inputs || {};
    const text = inputs.text || '';

    // 检测是否为负面提示词（包含常见负面词汇）
    const isNegative = this.isNegativePrompt(text);

    return [
      {
        id: `prompt_${nodeId}`,
        name: isNegative ? '负面提示词' : '提示词',
        description: isNegative
          ? '描述不想要的内容'
          : '描述想要生成的图像',
        type: ParameterType.TEXT,
        nodeId,
        inputName: 'text',
        defaultValue: text,
        required: true,
      },
    ];
  }

  /**
   * 提取 KSampler 参数
   */
  private extractKSamplerParams(
    nodeId: string,
    nodeData: any
  ): Parameter[] {
    const inputs = nodeData.inputs || {};

    return [
      {
        id: `steps_${nodeId}`,
        name: '采样步数',
        description: '生成图像的采样步数',
        type: ParameterType.NUMBER,
        nodeId,
        inputName: 'steps',
        defaultValue: inputs.steps || 20,
        min: 1,
        max: 100,
        required: false,
      },
      {
        id: `cfg_${nodeId}`,
        name: 'CFG Scale',
        description: '提示词遵循度',
        type: ParameterType.NUMBER,
        nodeId,
        inputName: 'cfg',
        defaultValue: inputs.cfg || 7.0,
        min: 1,
        max: 20,
        required: false,
      },
      {
        id: `seed_${nodeId}`,
        name: '随机种子',
        description: '生成结果的随机种子',
        type: ParameterType.NUMBER,
        nodeId,
        inputName: 'seed',
        defaultValue: inputs.seed ?? -1, // -1 表示随机
        min: -1,
        max: Number.MAX_SAFE_INTEGER,
        required: false,
      },
    ];
  }

  /**
   * 提取潜空间尺寸参数
   */
  private extractLatentParams(
    nodeId: string,
    nodeData: any
  ): Parameter[] {
    const inputs = nodeData.inputs || {};

    return [
      {
        id: `width_${nodeId}`,
        name: '宽度',
        description: '生成图像的宽度（像素）',
        type: ParameterType.NUMBER,
        nodeId,
        inputName: 'width',
        defaultValue: inputs.width || 512,
        min: 64,
        max: 4096,
        required: false,
      },
      {
        id: `height_${nodeId}`,
        name: '高度',
        description: '生成图像的高度（像素）',
        type: ParameterType.NUMBER,
        nodeId,
        inputName: 'height',
        defaultValue: inputs.height || 512,
        min: 64,
        max: 4096,
        required: false,
      },
    ];
  }

  /**
   * 提取检查点参数
   */
  private extractCheckpointParam(
    nodeId: string,
    nodeData: any
  ): Parameter {
    const inputs = nodeData.inputs || {};

    return {
      id: `checkpoint_${nodeId}`,
      name: '检查点模型',
      description: '使用的检查点模型',
      type: ParameterType.TEXT,
      nodeId,
      inputName: 'ckpt_name',
      defaultValue: inputs.ckpt_name || '',
      required: false,
    };
  }

  /**
   * 判断是否为负面提示词
   */
  private isNegativePrompt(text: string): boolean {
    const negativeKeywords = [
      'ugly',
      'bad',
      'poor',
      'worst',
      'blurry',
      'deformed',
      'disfigured',
      'low quality',
      'watermark',
      'text',
    ];

    const lowerText = text.toLowerCase();
    return negativeKeywords.some((keyword) => lowerText.includes(keyword));
  }
}
