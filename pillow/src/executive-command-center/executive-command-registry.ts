import type { ExecutiveCommandCenterConfiguration } from "./configuration.js";
import type {
  ApprovalView,
  BusinessStateView,
  ExecutiveReportView,
  MemoryView,
  RegisteredMission,
  RegisteredTool,
  RegisteredWorker,
} from "./types.js";

/** In-memory registry of executive-accessible resources for the command layer. */
export class ExecutiveCommandRegistry {
  private workers: RegisteredWorker[] = [];
  private tools: RegisteredTool[] = [];
  private missions: RegisteredMission[] = [];
  private businessStates: BusinessStateView[] = [];
  private approvals: ApprovalView[] = [];
  private executionMemory: MemoryView[] = [];
  private decisionMemory: MemoryView[] = [];
  private executiveReports: ExecutiveReportView[] = [];

  seed(config: ExecutiveCommandCenterConfiguration) {
    this.workers = config.seedWorkers.map((w) => ({ ...w }));
    this.tools = config.seedTools.map((t) => ({ ...t }));
    this.missions = config.seedMissions.map((m) => ({ ...m }));
    this.businessStates = config.seedBusinessStates.map((b) => ({ ...b }));
    this.approvals = config.seedApprovals.map((a) => ({ ...a }));
    this.executionMemory = config.seedExecutionMemory.map((m) => ({ ...m }));
    this.decisionMemory = config.seedDecisionMemory.map((m) => ({ ...m }));
    this.executiveReports = config.seedExecutiveReports.map((r) => ({ ...r }));
  }

  listWorkers(workerId?: string | null) {
    const all = this.workers.map((w) => ({ ...w }));
    if (!workerId?.trim()) return all;
    const id = workerId.trim().toLowerCase();
    return all.filter((w) => w.workerId.toLowerCase() === id || w.workerId.toLowerCase().includes(id));
  }

  listTools(toolId?: string | null, approvedOnly = false) {
    let all = this.tools.map((t) => ({ ...t }));
    if (approvedOnly) all = all.filter((t) => t.approved);
    if (!toolId?.trim()) return all;
    const id = toolId.trim().toLowerCase();
    return all.filter((t) => t.toolId.toLowerCase() === id || t.toolId.toLowerCase().includes(id));
  }

  listMissions(missionId?: string | null) {
    const all = this.missions.map((m) => ({ ...m }));
    if (!missionId?.trim()) return all;
    const id = missionId.trim().toLowerCase();
    return all.filter((m) => m.missionId.toLowerCase() === id || m.missionId.toLowerCase().includes(id));
  }

  listBusinessStates(businessId?: string | null) {
    const all = this.businessStates.map((b) => ({ ...b }));
    if (!businessId?.trim()) return all;
    const id = businessId.trim().toLowerCase();
    return all.filter(
      (b) => b.businessId.toLowerCase() === id || b.businessId.toLowerCase().includes(id),
    );
  }

  listApprovals(query?: string | null) {
    const all = this.approvals.map((a) => ({ ...a }));
    if (!query?.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter(
      (a) =>
        a.approvalId.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q) ||
        a.subject.toLowerCase().includes(q),
    );
  }

  listExecutionMemory(query?: string | null) {
    return filterMemory(this.executionMemory, query);
  }

  listDecisionMemory(query?: string | null) {
    return filterMemory(this.decisionMemory, query);
  }

  listExecutiveReports(reportId?: string | null) {
    const all = this.executiveReports.map((r) => ({ ...r }));
    if (!reportId?.trim()) return all;
    const id = reportId.trim().toLowerCase();
    return all.filter((r) => r.reportId.toLowerCase() === id || r.reportId.toLowerCase().includes(id));
  }

  counts() {
    return {
      workers: this.workers.length,
      tools: this.tools.length,
      missions: this.missions.length,
      businessStates: this.businessStates.length,
      approvals: this.approvals.length,
      executionMemory: this.executionMemory.length,
      decisionMemory: this.decisionMemory.length,
      executiveReports: this.executiveReports.length,
    };
  }
}

function filterMemory(items: MemoryView[], query?: string | null) {
  const all = items.map((m) => ({ ...m }));
  if (!query?.trim()) return all;
  const q = query.trim().toLowerCase();
  return all.filter(
    (m) => m.memoryId.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q),
  );
}
