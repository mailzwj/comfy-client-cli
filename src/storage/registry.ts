/**
 * 工作流注册存储
 */

import { mkdir, readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { homedir } from 'os';
import type { Workflow, WorkflowRegistry } from '../workflow/types.js';

// ==================== 存储路径 ====================

const STORAGE_DIR = join(homedir(), '.comfy-client-cli');
const WORKFLOWS_DIR = join(STORAGE_DIR, 'workflows');

// ==================== 工作流注册存储 ====================

export class WorkflowRegistryImpl implements WorkflowRegistry {
  /**
   * 保存工作流
   */
  async save(
    workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Workflow> {
    const now = new Date().toISOString();
    const id = this.generateId();

    const fullWorkflow: Workflow = {
      ...workflow,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // 确保目录存在
    await mkdir(WORKFLOWS_DIR, { recursive: true });

    // 保存为 YAML 格式（简化为 JSON）
    const filePath = join(WORKFLOWS_DIR, `${id}.json`);
    await writeFile(filePath, JSON.stringify(fullWorkflow, null, 2));

    return fullWorkflow;
  }

  /**
   * 获取工作流
   */
  async get(id: string): Promise<Workflow | null> {
    try {
      const filePath = join(WORKFLOWS_DIR, `${id}.json`);
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as Workflow;
    } catch {
      return null;
    }
  }

  /**
   * 列出所有工作流
   */
  async list(): Promise<Workflow[]> {
    try {
      const files = await readdir(WORKFLOWS_DIR);
      const workflows: Workflow[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = join(WORKFLOWS_DIR, file);
        const content = await readFile(filePath, 'utf-8');
        workflows.push(JSON.parse(content) as Workflow);
      }

      // 按更新时间排序
      return workflows.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch {
      return [];
    }
  }

  /**
   * 更新工作流
   */
  async update(
    id: string,
    updates: Partial<Workflow>
  ): Promise<Workflow | null> {
    const existing = await this.get(id);
    if (!existing) return null;

    const updated: Workflow = {
      ...existing,
      ...updates,
      id, // 确保 ID 不被覆盖
      createdAt: existing.createdAt, // 确保创建时间不被覆盖
      updatedAt: new Date().toISOString(),
    };

    const filePath = join(WORKFLOWS_DIR, `${id}.json`);
    await writeFile(filePath, JSON.stringify(updated, null, 2));

    return updated;
  }

  /**
   * 删除工作流
   */
  async delete(id: string): Promise<boolean> {
    try {
      const filePath = join(WORKFLOWS_DIR, `${id}.json`);
      const fileStat = await stat(filePath);

      if (fileStat.isFile()) {
        // 使用 fs 的 unlink，因为 fs/promises 在某些版本中可能不支持
        const { unlink } = await import('fs/promises');
        await unlink(filePath);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 获取存储目录
   */
  static getStorageDir(): string {
    return STORAGE_DIR;
  }

  /**
   * 获取工作流目录
   */
  static getWorkflowsDir(): string {
    return WORKFLOWS_DIR;
  }
}

// 导出单例
export const workflowRegistry = new WorkflowRegistryImpl();
