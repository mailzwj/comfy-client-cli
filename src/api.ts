import axios from "axios";
import WebSocket from "ws";
import fs from "fs";
import path from "path";
import { WorkflowJSON } from "./workflow.js";

export interface PromptResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, unknown>;
}

export interface HistoryOutput {
  images?: Array<{ filename: string; subfolder: string; type: string }>;
}

export async function queuePrompt(
  serverUrl: string,
  workflow: WorkflowJSON,
  clientId: string
): Promise<PromptResponse> {
  const response = await axios.post(`${serverUrl}/prompt`, {
    prompt: workflow,
    client_id: clientId,
  });
  return response.data as PromptResponse;
}

export async function waitForCompletion(
  serverUrl: string,
  promptId: string,
  clientId: string,
  onProgress?: (value: number, max: number, nodeId: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const wsUrl = serverUrl.replace(/^http/, "ws") + `/ws?clientId=${clientId}`;
    const ws = new WebSocket(wsUrl);

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("等待超时（5分钟）"));
    }, 5 * 60 * 1000);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "progress" && msg.data?.prompt_id === promptId) {
          onProgress?.(msg.data.value, msg.data.max, msg.data.node);
        }
        if (
          msg.type === "executing" &&
          msg.data?.prompt_id === promptId &&
          msg.data?.node === null
        ) {
          clearTimeout(timeout);
          ws.close();
          resolve();
        }
      } catch {
        // ignore parse errors
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function downloadOutputs(
  serverUrl: string,
  promptId: string,
  outputDir: string
): Promise<string[]> {
  const response = await axios.get(`${serverUrl}/history/${promptId}`);
  const history = response.data as Record<string, { outputs: Record<string, HistoryOutput> }>;
  const promptHistory = history[promptId];
  if (!promptHistory) return [];

  const savedFiles: string[] = [];
  fs.mkdirSync(outputDir, { recursive: true });

  for (const nodeOutput of Object.values(promptHistory.outputs)) {
    if (!nodeOutput.images) continue;
    for (const image of nodeOutput.images) {
      const url = `${serverUrl}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder)}&type=${image.type}`;
      const imgResponse = await axios.get(url, { responseType: "arraybuffer" });
      const filePath = path.join(outputDir, image.filename);
      fs.writeFileSync(filePath, Buffer.from(imgResponse.data as ArrayBuffer));
      savedFiles.push(filePath);
    }
  }

  return savedFiles;
}

export async function checkServerHealth(serverUrl: string): Promise<boolean> {
  try {
    await axios.get(`${serverUrl}/system_stats`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
