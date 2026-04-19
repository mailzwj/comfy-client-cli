/**
 * ComfyUI API 客户端
 */
import type { ComfyUIClientConfig, QueueStatus, HistoryItem } from '../workflow/types.js';
export interface ProgressEvent {
    value: number;
    max: number;
    prompt_id: string;
    node: string;
}
export interface StatusEvent {
    status: {
        exec_info: {
            queue_remaining: number;
        };
    };
}
export declare class ComfyUIClient {
    private client;
    private ws?;
    private config;
    constructor(config?: ComfyUIClientConfig);
    connectWebSocket(): void;
    onProgress(callback: (data: ProgressEvent) => void): void;
    onStatus(callback: (data: StatusEvent) => void): void;
    disconnectWebSocket(): void;
    /**
     * 健康检查
     */
    healthCheck(): Promise<boolean>;
    /**
     * 获取所有节点类型信息
     */
    getObjectInfo(): Promise<Record<string, any>>;
    /**
     * 提交工作流
     */
    submitPrompt(prompt: Record<string, any>, clientId?: string): Promise<string>;
    /**
     * 获取任务队列状态
     */
    getQueueStatus(): Promise<QueueStatus>;
    /**
     * 获取任务历史
     */
    getHistory(promptId: string): Promise<Record<string, HistoryItem>>;
    /**
     * 等待任务完成
     */
    waitForCompletion(promptId: string, pollInterval?: number): Promise<HistoryItem>;
    /**
     * 下载输出结果
     */
    downloadOutputs(result: HistoryItem, outputDir: string): Promise<void>;
    /**
     * 清空队列
     */
    interrupt(): Promise<void>;
    /**
     * 清空队列
     */
    queuePrompt(): Promise<void>;
}
//# sourceMappingURL=comfyui-client.d.ts.map