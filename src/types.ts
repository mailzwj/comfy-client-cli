export interface WorkflowParam {
  nodeId: string;
  field: string;
  label: string;
  defaultValue: string | number | boolean;
  type: "string" | "number" | "boolean";
  description?: string;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  params: WorkflowParam[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStore {
  workflows: WorkflowConfig[];
}

export interface RunOptions {
  output: string;
  yes: boolean;
  server: string;
  [key: string]: string | boolean; // 支持动态参数键
}
