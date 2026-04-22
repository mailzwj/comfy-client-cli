/**
 * 工作流参数提取器
 * 从 ComfyUI 工作流 JSON 中提取可配置的参数
 */
import { ParameterType } from './types.js';
// ==================== 参数提取器 ====================
export class ParameterExtractor {
    /**
     * 需要监控的节点类型
     */
    targetNodes = [
        'CLIPTextEncode', // 提示词节点
        'KSampler', // 采样器节点
        'KSamplerAdvanced', // 高级采样器节点
        'EmptyLatentImage', // 潜空间尺寸节点
        'CheckpointLoaderSimple', // 检查点加载节点
        'VAEDecode', // VAE 解码节点
    ];
    /**
     * 从工作流 JSON 中提取可配置参数
     */
    extract(workflowJson) {
        const parameters = [];
        // 构建提示词类型映射（通过 KSampler 连接关系判断正/负向）
        const promptTypeMap = this.buildPromptTypeMap(workflowJson);
        // 遍历所有节点
        for (const [nodeId, nodeData] of Object.entries(workflowJson)) {
            // 跳过非节点数据
            if (!nodeData.class_type)
                continue;
            const className = nodeData.class_type;
            // 只处理目标节点类型
            if (!this.targetNodes.includes(className))
                continue;
            // 根据节点类型提取参数
            switch (className) {
                case 'CLIPTextEncode':
                    parameters.push(...this.extractPromptParams(nodeId, nodeData, promptTypeMap));
                    break;
                case 'KSampler':
                case 'KSamplerAdvanced':
                    parameters.push(...this.extractKSamplerParams(nodeId, nodeData));
                    break;
                case 'EmptyLatentImage':
                    parameters.push(...this.extractLatentParams(nodeId, nodeData));
                    break;
                case 'CheckpointLoaderSimple': {
                    const param = this.extractCheckpointParam(nodeId, nodeData);
                    if (param)
                        parameters.push(param);
                    break;
                }
            }
        }
        return parameters;
    }
    /**
     * 通过 KSampler 节点的 positive/negative 输入连接，构建 CLIPTextEncode 节点的提示词类型映射
     */
    buildPromptTypeMap(workflowJson) {
        const typeMap = new Map();
        const samplerTypes = ['KSampler', 'KSamplerAdvanced'];
        for (const [_nodeId, nodeData] of Object.entries(workflowJson)) {
            if (!nodeData.class_type || !samplerTypes.includes(nodeData.class_type))
                continue;
            const inputs = nodeData.inputs || {};
            // ComfyUI API 格式中，连接表示为 [nodeId, outputIndex]
            if (Array.isArray(inputs.positive)) {
                const connectedNodeId = String(inputs.positive[0]);
                typeMap.set(connectedNodeId, 'positive');
            }
            if (Array.isArray(inputs.negative)) {
                const connectedNodeId = String(inputs.negative[0]);
                typeMap.set(connectedNodeId, 'negative');
            }
        }
        return typeMap;
    }
    /**
     * 提取提示词参数
     */
    extractPromptParams(nodeId, nodeData, promptTypeMap) {
        const inputs = nodeData.inputs || {};
        // 跳过节点连接（数组表示连接到其他节点）
        if (Array.isArray(inputs.text))
            return [];
        const text = inputs.text || '';
        // 优先通过图连接判断，回退到关键词匹配
        const promptType = promptTypeMap.get(nodeId) ?? (this.isNegativePrompt(text) ? 'negative' : 'positive');
        const isNegative = promptType === 'negative';
        return [
            {
                id: `prompt_${nodeId}`,
                name: isNegative ? '负向提示词' : '正向提示词',
                description: isNegative
                    ? '描述不想要的内容（negative prompt）'
                    : '描述想要生成的图像（positive prompt）',
                type: ParameterType.TEXT,
                nodeId,
                inputName: 'text',
                defaultValue: text,
                required: !isNegative,
                promptType,
            },
        ];
    }
    /**
     * 提取 KSampler 参数
     */
    extractKSamplerParams(nodeId, nodeData) {
        const inputs = nodeData.inputs || {};
        const params = [];
        // 只提取直接值参数，跳过节点连接（数组表示连接到其他节点）
        if (!Array.isArray(inputs.steps)) {
            params.push({
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
            });
        }
        if (!Array.isArray(inputs.cfg)) {
            params.push({
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
            });
        }
        if (!Array.isArray(inputs.seed)) {
            params.push({
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
            });
        }
        return params;
    }
    /**
     * 提取潜空间尺寸参数
     */
    extractLatentParams(nodeId, nodeData) {
        const inputs = nodeData.inputs || {};
        const params = [];
        if (!Array.isArray(inputs.width)) {
            params.push({
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
            });
        }
        if (!Array.isArray(inputs.height)) {
            params.push({
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
            });
        }
        return params;
    }
    /**
     * 提取检查点参数
     */
    extractCheckpointParam(nodeId, nodeData) {
        const inputs = nodeData.inputs || {};
        // 跳过节点连接
        if (Array.isArray(inputs.ckpt_name))
            return null;
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
    isNegativePrompt(text) {
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
//# sourceMappingURL=parameter-extractor.js.map