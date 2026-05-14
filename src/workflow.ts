import fs from "fs";
import { WorkflowParam } from "./types.js";

// 已知的常见可配置字段映射
const KNOWN_FIELDS: Record<string, { label: string; type: "string" | "number" | "boolean"; description: string }> = {
  text: { label: "提示词", type: "string", description: "文本提示词" },
  positive: { label: "正向提示词", type: "string", description: "正向提示词" },
  negative: { label: "负向提示词", type: "string", description: "负向提示词" },
  steps: { label: "采样步数", type: "number", description: "采样迭代步数" },
  cfg: { label: "CFG Scale", type: "number", description: "CFG 引导系数" },
  cfg_scale: { label: "CFG Scale", type: "number", description: "CFG 引导系数" },
  seed: { label: "随机种子", type: "number", description: "随机种子，-1 为随机" },
  noise_seed: { label: "噪声种子", type: "number", description: "噪声随机种子" },
  sampler_name: { label: "采样器", type: "string", description: "采样算法名称" },
  scheduler: { label: "调度器", type: "string", description: "噪声调度器" },
  denoise: { label: "去噪强度", type: "number", description: "去噪强度（0-1）" },
  width: { label: "图像宽度", type: "number", description: "输出图像宽度（像素）" },
  height: { label: "图像高度", type: "number", description: "输出图像高度（像素）" },
  batch_size: { label: "批量大小", type: "number", description: "每次生成图像数量" },
  ckpt_name: { label: "模型文件", type: "string", description: "Checkpoint 模型文件名" },
  lora_name: { label: "LoRA 文件", type: "string", description: "LoRA 模型文件名" },
  strength_model: { label: "LoRA 模型强度", type: "number", description: "LoRA 对模型的影响强度" },
  strength_clip: { label: "LoRA CLIP 强度", type: "number", description: "LoRA 对 CLIP 的影响强度" },
  guidance: { label: "引导系数", type: "number", description: "引导系数" },
  max_shift: { label: "最大偏移", type: "number", description: "最大偏移量" },
  base_shift: { label: "基础偏移", type: "number", description: "基础偏移量" },
  filename_prefix: { label: "文件名前缀", type: "string", description: "输出文件名前缀" },
};

// 跳过的字段（通常是节点引用，不是用户配置项）
const SKIP_FIELDS = new Set([
  "model", "clip", "vae", "latent_image", "samples", "images",
  "image", "mask", "conditioning", "positive", "negative",
  "clip_vision", "control_net", "style_model", "gligen",
  "upscale_model", "sigmas",
]);

export interface WorkflowNode {
  class_type: string;
  inputs: Record<string, unknown>;
}

export type WorkflowJSON = Record<string, WorkflowNode>;

export function loadWorkflowFile(filePath: string): WorkflowJSON {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);
  // ComfyUI 工作流可能直接是节点对象，或者包含在 prompt 字段中
  if (data.prompt) return data.prompt as WorkflowJSON;
  return data as WorkflowJSON;
}

export function extractParams(workflow: WorkflowJSON): WorkflowParam[] {
  const params: WorkflowParam[] = [];

  for (const [nodeId, node] of Object.entries(workflow)) {
    if (!node.inputs) continue;
    for (const [field, value] of Object.entries(node.inputs)) {
      // 跳过数组类型（节点引用）
      if (Array.isArray(value)) continue;
      // 跳过 null/undefined
      if (value === null || value === undefined) continue;

      const fieldInfo = KNOWN_FIELDS[field];
      if (!fieldInfo) continue;
      if (SKIP_FIELDS.has(field)) continue;

      // 根据字段名推断类型
      const valueType = typeof value;
      const paramType = fieldInfo.type;

      params.push({
        nodeId,
        field,
        label: `${fieldInfo.label} (节点 ${nodeId} · ${node.class_type})`,
        defaultValue: value as string | number | boolean,
        type: paramType,
        description: fieldInfo.description,
      });
    }
  }

  return params;
}

export function applyParams(
  workflow: WorkflowJSON,
  params: WorkflowParam[],
  values: Record<string, string | number | boolean>
): WorkflowJSON {
  const result = JSON.parse(JSON.stringify(workflow)) as WorkflowJSON;

  for (const param of params) {
    const key = `${param.nodeId}.${param.field}`;
    if (values[key] !== undefined) {
      if (!result[param.nodeId]) continue;
      if (!result[param.nodeId].inputs) continue;
      let val: string | number | boolean = values[key];
      if (param.type === "number") {
        val = Number(val);
      } else if (param.type === "boolean") {
        val = val === "true" || val === true;
      }
      result[param.nodeId].inputs[param.field] = val;
    }
  }

  return result;
}

/**
 * 将参数列表转换为 commander 选项名称
 * 格式: nodeId.field -> --nodeId-field
 */
export function paramToOptionName(param: WorkflowParam): string {
  return `${param.nodeId}-${param.field}`;
}

/**
 * 将 commander 选项名（camelCase）转回 nodeId.field
 */
export function optionNameToParamKey(optName: string): string {
  // commander 将 --foo-bar 转成 fooBar，需要反向推导
  return optName; // 我们直接用 nodeId-field 格式在 opts 中查找
}
