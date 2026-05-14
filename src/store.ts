import fs from "fs";
import path from "path";
import os from "os";
import { WorkflowConfig, WorkflowStore } from "./types.js";

const STORE_DIR = path.join(os.homedir(), ".comfy-client-cli");
const STORE_FILE = path.join(STORE_DIR, "workflows.json");

export function ensureStoreDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

export function loadStore(): WorkflowStore {
  ensureStoreDir();
  if (!fs.existsSync(STORE_FILE)) {
    return { workflows: [] };
  }
  const content = fs.readFileSync(STORE_FILE, "utf-8");
  return JSON.parse(content) as WorkflowStore;
}

export function saveStore(store: WorkflowStore): void {
  ensureStoreDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export function getWorkflow(id: string): WorkflowConfig | undefined {
  const store = loadStore();
  return store.workflows.find((w) => w.id === id);
}

export function addWorkflow(workflow: WorkflowConfig): void {
  const store = loadStore();
  store.workflows.push(workflow);
  saveStore(store);
}

export function updateWorkflow(
  id: string,
  updates: Partial<WorkflowConfig>
): boolean {
  const store = loadStore();
  const index = store.workflows.findIndex((w) => w.id === id);
  if (index === -1) return false;
  store.workflows[index] = {
    ...store.workflows[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return true;
}

export function deleteWorkflow(id: string): boolean {
  const store = loadStore();
  const index = store.workflows.findIndex((w) => w.id === id);
  if (index === -1) return false;
  store.workflows.splice(index, 1);
  saveStore(store);
  return true;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
