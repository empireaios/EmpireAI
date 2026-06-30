import type {
  StrategicMemoryEntry,
  StrategicMemoryLifecycleRecord,
} from "../models/strategic-memory.js";

export interface StrategicMemoryRepository {
  saveMemory(entry: StrategicMemoryEntry): StrategicMemoryEntry;
  getMemoryById(memoryId: string): StrategicMemoryEntry | null;
  listMemories(workspaceId: string, category?: string, status?: string): StrategicMemoryEntry[];

  appendLifecycle(record: StrategicMemoryLifecycleRecord): StrategicMemoryLifecycleRecord;
  listLifecycle(memoryId: string, limit?: number): StrategicMemoryLifecycleRecord[];
  listWorkspaceLifecycle(workspaceId: string, limit?: number): StrategicMemoryLifecycleRecord[];
}
