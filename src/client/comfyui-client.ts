/**
 * ComfyUI API 客户端
 */

import axios, { AxiosInstance } from 'axios';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import WebSocket from 'ws';
import type {
  ComfyUIClientConfig,
  PromptResponse,
  QueueStatus,
  HistoryItem,
} from '../workflow/types.js';

// ==================== 事件类型 ====================

export interface ProgressEvent {
  value: number;
  max: number;
  prompt_id: string;
  node: string;
}

export interface StatusEvent {
  status: { exec_info: { queue_remaining: number } };
}

// ==================== ComfyUI 客户端 ====================

export class ComfyUIClient {
  private client: AxiosInstance;
  private ws?: WebSocket;
  private config: ComfyUIClientConfig;

  constructor(config: ComfyUIClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://127.0.0.1:8188',
      apiKey: config.apiKey,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (this.config.apiKey) {
      this.client.defaults.headers.common['Authorization'] =
        `Bearer ${this.config.apiKey}`;
    }
  }

  // ==================== WebSocket 连接 ====================

  connectWebSocket(): void {
    const wsUrl = this.config.baseUrl.replace('http', 'ws') + '/ws';
    
    this.ws = new WebSocket(wsUrl);
    const ws = this.ws as WebSocket; // 类型断言

    ws.on('open', () => {
      // 发送消息订阅事件
      ws.send(
        JSON.stringify({
          update: true,
        })
      );
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  onProgress(callback: (data: ProgressEvent) => void): void {
    if (this.ws) {
      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'progress') {
          callback(message.data);
        }
      });
    }
  }

  onStatus(callback: (data: StatusEvent) => void): void {
    if (this.ws) {
      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'status') {
          callback(message.data);
        }
      });
    }
  }

  disconnectWebSocket(): void {
    this.ws?.close();
  }

  // ==================== API 方法 ====================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取所有节点类型信息
   */
  async getObjectInfo(): Promise<Record<string, any>> {
    const response = await this.client.get('/object_info');
    return response.data;
  }

  /**
   * 提交工作流
   */
  async submitPrompt(
    prompt: Record<string, any>,
    clientId = `cli-${Date.now()}`
  ): Promise<string> {
    const response = await this.client.post<PromptResponse>('/prompt', {
      prompt,
      client_id: clientId,
    });
    return response.data.prompt_id;
  }

  /**
   * 获取任务队列状态
   */
  async getQueueStatus(): Promise<QueueStatus> {
    const response = await this.client.get<QueueStatus>('/queue');
    return response.data;
  }

  /**
   * 获取任务历史
   */
  async getHistory(promptId: string): Promise<Record<string, HistoryItem>> {
    const response = await this.client.get<Record<string, HistoryItem>>(
      `/history/${promptId}`
    );
    return response.data;
  }

  /**
   * 等待任务完成
   */
  async waitForCompletion(
    promptId: string,
    pollInterval = 1000
  ): Promise<HistoryItem> {
    while (true) {
      const history = await this.getHistory(promptId);

      if (history[promptId]) {
        return history[promptId];
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  /**
   * 下载输出结果
   */
  async downloadOutputs(result: HistoryItem, outputDir: string): Promise<void> {
    await mkdir(outputDir, { recursive: true });

    for (const [nodeId, nodeOutput] of Object.entries(result.outputs)) {
      const images = nodeOutput.images;

      if (!images) continue;

      for (const image of images) {
        const filename = image.filename;
        const subfolder = image.subfolder || '';

        const response = await this.client.get(
          `/view?filename=${filename}&subfolder=${subfolder}&type=output`,
          { responseType: 'stream' }
        );

        const outputPath = join(outputDir, subfolder, filename);
        await mkdir(join(outputDir, subfolder), { recursive: true });

        const writer = createWriteStream(outputPath);
        response.data.pipe(writer);

        await new Promise((_, reject) => {
          writer.on('finish', () => {});
          writer.on('error', reject);
        });
      }
    }
  }

  /**
   * 清空队列
   */
  async interrupt(): Promise<void> {
    await this.client.post('/interrupt');
  }

  /**
   * 清空队列
   */
  async queuePrompt(): Promise<void> {
    await this.client.post('/queue/prompts');
  }
}
