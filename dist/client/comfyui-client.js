/**
 * ComfyUI API 客户端
 */
import axios from 'axios';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import WebSocket from 'ws';
// ==================== ComfyUI 客户端 ====================
export class ComfyUIClient {
    client;
    ws;
    config;
    constructor(config = {}) {
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
    connectWebSocket() {
        const wsUrl = this.config.baseUrl.replace('http', 'ws') + '/ws';
        this.ws = new WebSocket(wsUrl);
        const ws = this.ws; // 类型断言
        ws.on('open', () => {
            // 发送消息订阅事件
            ws.send(JSON.stringify({
                update: true,
            }));
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    }
    onProgress(callback) {
        if (this.ws) {
            this.ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'progress') {
                    callback(message.data);
                }
            });
        }
    }
    onStatus(callback) {
        if (this.ws) {
            this.ws.on('message', (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === 'status') {
                    callback(message.data);
                }
            });
        }
    }
    disconnectWebSocket() {
        this.ws?.close();
    }
    // ==================== API 方法 ====================
    /**
     * 健康检查
     */
    async healthCheck() {
        try {
            await this.client.get('/');
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 获取所有节点类型信息
     */
    async getObjectInfo() {
        const response = await this.client.get('/object_info');
        return response.data;
    }
    /**
     * 提交工作流
     */
    async submitPrompt(prompt, clientId = `cli-${Date.now()}`) {
        try {
            const response = await this.client.post('/prompt', {
                prompt,
                client_id: clientId,
            });
            return response.data.prompt_id;
        }
        catch (error) {
            if (error.response?.data) {
                const data = error.response.data;
                const details = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                throw new Error(`ComfyUI 拒绝了工作流 (${error.response.status}): ${details}`);
            }
            throw error;
        }
    }
    /**
     * 获取任务队列状态
     */
    async getQueueStatus() {
        const response = await this.client.get('/queue');
        return response.data;
    }
    /**
     * 获取任务历史
     */
    async getHistory(promptId) {
        const response = await this.client.get(`/history/${promptId}`);
        return response.data;
    }
    /**
     * 等待任务完成
     */
    async waitForCompletion(promptId, pollInterval = 1000) {
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
    async downloadOutputs(result, outputDir) {
        await mkdir(outputDir, { recursive: true });
        for (const [nodeId, nodeOutput] of Object.entries(result.outputs)) {
            const images = nodeOutput.images;
            if (!images)
                continue;
            for (const image of images) {
                const filename = image.filename;
                const subfolder = image.subfolder || '';
                const response = await this.client.get(`/view?filename=${filename}&subfolder=${subfolder}&type=output`, { responseType: 'stream' });
                const outputPath = join(outputDir, subfolder, filename);
                await mkdir(join(outputDir, subfolder), { recursive: true });
                const writer = createWriteStream(outputPath);
                response.data.pipe(writer);
                await new Promise((resolve, reject) => {
                    writer.on('finish', () => resolve());
                    writer.on('error', reject);
                });
            }
        }
    }
    /**
     * 清空队列
     */
    async interrupt() {
        await this.client.post('/interrupt');
    }
    /**
     * 清空队列
     */
    async queuePrompt() {
        await this.client.post('/queue/prompts');
    }
}
//# sourceMappingURL=comfyui-client.js.map