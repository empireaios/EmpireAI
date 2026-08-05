import type { ToolStore } from "./tool-store.js";

export type ToolUsageRecord = {
  toolId: string;
  toolName: string;
  invocationCount: number;
  successCount: number;
  failureCount: number;
  deniedCount: number;
  lastUsedAt: string | null;
};

export class UsageTracker {
  track(store: ToolStore): ToolUsageRecord[] {
    const tools = store.listTools();
    return tools.map((tool) => {
      const invocations = store.listInvocationsForTool(tool.toolId);
      const last = invocations.at(-1);
      return {
        toolId: tool.toolId,
        toolName: tool.toolName,
        invocationCount: invocations.length,
        successCount: invocations.filter((i) => i.status === "success").length,
        failureCount: invocations.filter(
          (i) => i.status === "failed" || i.status === "unavailable",
        ).length,
        deniedCount: invocations.filter((i) => i.status === "denied").length,
        lastUsedAt: last?.timestamp ?? null,
      };
    });
  }

  getUsageForTool(store: ToolStore, toolId: string): ToolUsageRecord | null {
    return this.track(store).find((r) => r.toolId === toolId) ?? null;
  }
}
