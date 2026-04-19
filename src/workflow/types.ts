/**
 * ComfyUI CLI - 类型定义
 */

import type inquirer from 'inquirer';

// ==================== 参数类型 ====================

export enum ParameterType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  BOOLEAN = 'boolean',
  IMAGE = 'image',
  STRING_ARRAY = 'string_array',
}

// ==================== 参数定义 ====================

export interface Parameter {
  id: string;                    // 参数唯一 ID
  name: string;                  // 参数显示名称
  description?: string;          // 参数描述
  type: ParameterType;
  nodeId: string;                // 所属节点 ID
  inputName: string;             // 节点输入名称
  defaultValue?: any;
  options?: string[];            // 选择项（select 类型）
  min?: number;                  // 最小值（number 类型）
  max?: number;                  // 最大值（number 类型）
  required: boolean;
  template?: string;             // 提示词模板变量
}

// ==================== 节点配置 ====================

export interface NodeConfig {
  nodeId: string;
  className: string;
  inputTypes: Record<string, ParameterType>;
}

// ==================== 工作流定义 ====================

export interface Workflow {
  id: string;                    // UUID
  name: string;                  // 用户友好名称
  description?: string;          // 描述
  sourceFile: string;            // 原始工作流 JSON 文件路径
  workflowJson: Record<string, any>;  // 工作流 JSON
  nodes: NodeConfig[];           // 提取的节点配置
  parameters: Parameter[];       // 可配置参数
  createdAt: string;             // ISO 日期字符串
  updatedAt: string;             // ISO 日期字符串
}

// ==================== 存储接口 ====================

export interface WorkflowRegistry {
  save(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
  get(id: string): Promise<Workflow | null>;
  list(): Promise<Workflow[]>;
  update(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
  delete(id: string): Promise<boolean>;
}

// ==================== 客户端配置 ====================

export interface ComfyUIClientConfig {
  baseUrl?: string;
  apiKey?: string;
}

// ==================== API 响应类型 ====================

export interface PromptResponse {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, any[]>;
}

export interface QueueStatus {
  running: string[];
  queue: Array<{ prompt_id: string; num: number; truncate_input: boolean }>;
}

export interface HistoryItem {
  outputs: Record<
    string,
    { images?: Array<{ filename: string; subfolder: string; type: string }> }
  >;
}
