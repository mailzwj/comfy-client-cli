/**
 * 工作流注册存储
 */
import type { Workflow, WorkflowRegistry } from '../workflow/types.js';
export declare class WorkflowRegistryImpl implements WorkflowRegistry {
    /**
     * 保存工作流
     */
    save(workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workflow>;
    /**
     * 获取工作流
     */
    get(id: string): Promise<Workflow | null>;
    /**
     * 列出所有工作流
     */
    list(): Promise<Workflow[]>;
    /**
     * 更新工作流
     */
    update(id: string, updates: Partial<Workflow>): Promise<Workflow | null>;
    /**
     * 删除工作流
     */
    delete(id: string): Promise<boolean>;
    /**
     * 生成唯一 ID
     */
    private generateId;
    /**
     * 获取存储目录
     */
    static getStorageDir(): string;
    /**
     * 获取工作流目录
     */
    static getWorkflowsDir(): string;
}
export declare const workflowRegistry: WorkflowRegistryImpl;
//# sourceMappingURL=registry.d.ts.map