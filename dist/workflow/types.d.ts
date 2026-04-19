/**
 * ComfyUI CLI - 类型定义
 */
export declare enum ParameterType {
    TEXT = "text",
    NUMBER = "number",
    SELECT = "select",
    BOOLEAN = "boolean",
    IMAGE = "image",
    STRING_ARRAY = "string_array"
}
export interface Parameter {
    id: string;
    name: string;
    description?: string;
    type: ParameterType;
    nodeId: string;
    inputName: string;
    defaultValue?: any;
    options?: string[];
    min?: number;
    max?: number;
    required: boolean;
    template?: string;
}
export interface NodeConfig {
    nodeId: string;
    className: string;
    inputTypes: Record<string, ParameterType>;
}
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    sourceFile: string;
    workflowJson: Record<string, any>;
    nodes: NodeConfig[];
    parameters: Parameter[];
    createdAt: string;
    updatedAt: string;
}
export interface WorkflowRegistry {
    save(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    get(id: string): Promise<Workflow | null>;
    list(): Promise<Workflow[]>;
    update(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
    delete(id: string): Promise<boolean>;
}
export interface ComfyUIClientConfig {
    baseUrl?: string;
    apiKey?: string;
}
export interface PromptResponse {
    prompt_id: string;
    number: number;
    node_errors?: Record<string, any[]>;
}
export interface QueueStatus {
    running: string[];
    queue: Array<{
        prompt_id: string;
        num: number;
        truncate_input: boolean;
    }>;
}
export interface HistoryItem {
    outputs: Record<string, {
        images?: Array<{
            filename: string;
            subfolder: string;
            type: string;
        }>;
    }>;
}
//# sourceMappingURL=types.d.ts.map