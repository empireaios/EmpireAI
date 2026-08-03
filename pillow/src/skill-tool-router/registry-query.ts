import type { RoutableTool, RoutableWorker } from "./types.js";

/**
 * Query surface over Workforce Capability Registry-aligned catalogs.
 * Does not mutate the live WCR — read-only routing queries only.
 */
export class RegistryQuery {
  private workers: RoutableWorker[] = [];
  private tools: RoutableTool[] = [];

  seed(workers: RoutableWorker[], tools: RoutableTool[]) {
    this.workers = workers.map((w) => this.cloneWorker(w));
    this.tools = tools.map((t) => this.cloneTool(t));
  }

  listWorkers() {
    return this.workers.map((w) => this.cloneWorker(w));
  }

  listTools() {
    return this.tools.map((t) => this.cloneTool(t));
  }

  queryWorkersByCapabilities(required: string[]): RoutableWorker[] {
    const caps = required.map((c) => c.toLowerCase());
    return this.listWorkers()
      .filter((worker) =>
        caps.some((cap) => worker.capabilities.some((wc) => wc.toLowerCase() === cap || wc.toLowerCase().includes(cap))),
      )
      .sort((a, b) => this.capabilityOverlap(b, caps) - this.capabilityOverlap(a, caps));
  }

  queryToolsByCapabilities(required: string[]): RoutableTool[] {
    const caps = required.map((c) => c.toLowerCase());
    return this.listTools()
      .filter((tool) =>
        caps.some((cap) =>
          tool.compatibleCapabilities.some((tc) => tc.toLowerCase() === cap || tc.toLowerCase().includes(cap)),
        ),
      )
      .sort((a, b) => this.toolOverlap(b, caps) - this.toolOverlap(a, caps));
  }

  getWorker(workerId: string) {
    const worker = this.workers.find((w) => w.workerId === workerId);
    return worker ? this.cloneWorker(worker) : null;
  }

  getToolByName(toolName: string) {
    const tool = this.tools.find((t) => t.toolName === toolName || t.toolId === toolName);
    return tool ? this.cloneTool(tool) : null;
  }

  private capabilityOverlap(worker: RoutableWorker, caps: string[]) {
    return worker.capabilities.filter((c) => caps.some((cap) => c.toLowerCase().includes(cap))).length;
  }

  private toolOverlap(tool: RoutableTool, caps: string[]) {
    return tool.compatibleCapabilities.filter((c) => caps.some((cap) => c.toLowerCase().includes(cap))).length;
  }

  private cloneWorker(worker: RoutableWorker): RoutableWorker {
    return {
      ...worker,
      capabilities: [...worker.capabilities],
      skills: [...worker.skills],
      approvedTools: [...worker.approvedTools],
    };
  }

  private cloneTool(tool: RoutableTool): RoutableTool {
    return {
      ...tool,
      compatibleCapabilities: [...tool.compatibleCapabilities],
    };
  }
}
