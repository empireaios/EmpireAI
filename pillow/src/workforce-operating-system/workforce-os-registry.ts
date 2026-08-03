import type { WorkforceOperatingSystemConfiguration } from "./configuration.js";
import type {
  CommunicationMessage,
  OrganizationState,
  RegisteredDepartment,
  RegisteredFactory,
  RegisteredMission,
  RegisteredWorker,
  WorkerLifecycleState,
  WorkforceSession,
} from "./types.js";

/** Live organizational registry for the Workforce Operating System. */
export class WorkforceOsRegistry {
  private departments = new Map<string, RegisteredDepartment>();
  private factories = new Map<string, RegisteredFactory>();
  private workers = new Map<string, RegisteredWorker>();
  private missions = new Map<string, RegisteredMission>();
  private sessions = new Map<string, WorkforceSession>();
  private communications: CommunicationMessage[] = [];
  private organizationState: OrganizationState = "forming";
  private started = false;

  seed(config: WorkforceOperatingSystemConfiguration) {
    this.departments.clear();
    this.factories.clear();
    this.workers.clear();
    this.missions.clear();
    this.sessions.clear();
    this.communications = [];
    this.organizationState = "forming";
    this.started = false;
    for (const d of config.seedDepartments) this.departments.set(d.departmentId, { ...d });
    for (const f of config.seedFactories) this.factories.set(f.factoryId, { ...f });
    for (const w of config.seedWorkers) this.workers.set(w.workerId, { ...w });
    for (const m of config.seedMissions) this.missions.set(m.missionId, { ...m });
  }

  start() {
    this.started = true;
    this.organizationState = "synchronized";
  }

  isStarted() {
    return this.started;
  }

  getOrganizationState() {
    return this.organizationState;
  }

  setOrganizationState(state: OrganizationState) {
    this.organizationState = state;
  }

  registerDepartment(department: RegisteredDepartment) {
    this.departments.set(department.departmentId, { ...department });
    return { ...department };
  }

  registerFactory(factory: RegisteredFactory) {
    this.factories.set(factory.factoryId, { ...factory });
    return { ...factory };
  }

  registerWorker(worker: RegisteredWorker) {
    this.workers.set(worker.workerId, { ...worker });
    return { ...worker };
  }

  setWorkerLifecycle(workerId: string, lifecycle: WorkerLifecycleState) {
    const existing = this.workers.get(workerId);
    if (!existing) return null;
    const updated = { ...existing, lifecycle };
    this.workers.set(workerId, updated);
    return { ...updated };
  }

  openSession(workerId: string, sessionId?: string | null) {
    sessionSequence += 1;
    const id = sessionId?.trim() || `wfos-ses-${Date.now()}-${sessionSequence}`;
    const session: WorkforceSession = {
      sessionId: id,
      workerId,
      state: "open",
      openedAt: new Date().toISOString(),
      closedAt: null,
    };
    this.sessions.set(id, session);
    return { ...session };
  }

  closeSession(sessionId: string) {
    const existing = this.sessions.get(sessionId);
    if (!existing) return null;
    const updated: WorkforceSession = {
      ...existing,
      state: "closed",
      closedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, updated);
    return { ...updated };
  }

  recordCommunication(message: Omit<CommunicationMessage, "messageId" | "timestamp">) {
    messageSequence += 1;
    const entry: CommunicationMessage = {
      messageId: `wfos-msg-${Date.now()}-${messageSequence}`,
      timestamp: new Date().toISOString(),
      ...message,
    };
    this.communications.push(entry);
    return { ...entry };
  }

  listDepartments(query?: string | null) {
    return filterById(
      [...this.departments.values()].map((d) => ({ ...d })),
      query,
      (d) => d.departmentId,
    );
  }

  listFactories(query?: string | null) {
    return filterById(
      [...this.factories.values()].map((f) => ({ ...f })),
      query,
      (f) => f.factoryId,
    );
  }

  listWorkers(query?: string | null) {
    return filterById(
      [...this.workers.values()].map((w) => ({ ...w })),
      query,
      (w) => w.workerId,
    );
  }

  listMissions(query?: string | null) {
    return filterById(
      [...this.missions.values()].map((m) => ({ ...m })),
      query,
      (m) => m.missionId,
    );
  }

  listSessions() {
    return [...this.sessions.values()].map((s) => ({ ...s }));
  }

  listOpenSessions() {
    return this.listSessions().filter((s) => s.state === "open");
  }

  listCommunications() {
    return this.communications.map((c) => ({ ...c }));
  }

  activeDepartmentIds() {
    return this.listDepartments()
      .filter((d) => d.status === "active")
      .map((d) => d.departmentId);
  }

  activeFactoryIds() {
    return this.listFactories()
      .filter((f) => f.status === "active")
      .map((f) => f.factoryId);
  }

  activeWorkerIds() {
    return this.listWorkers()
      .filter((w) => w.lifecycle === "active" || w.lifecycle === "idle")
      .map((w) => w.workerId);
  }

  activeMissionIds() {
    return this.listMissions()
      .filter((m) => m.status === "active")
      .map((m) => m.missionId);
  }

  discoverWorkers(departmentId?: string | null, factoryId?: string | null) {
    return this.listWorkers().filter((w) => {
      if (departmentId && w.departmentId !== departmentId) return false;
      if (factoryId && w.factoryId !== factoryId) return false;
      return w.lifecycle !== "retired";
    });
  }

  computeHealth(): "healthy" | "degraded" | "failed" | "standby" {
    if (!this.started) return "standby";
    if (this.organizationState === "halted") return "failed";
    if (this.organizationState === "degraded" || this.organizationState === "recovering") {
      return "degraded";
    }
    if (this.activeDepartmentIds().length === 0 || this.activeFactoryIds().length === 0) {
      return "degraded";
    }
    return "healthy";
  }

  synchronize(): OrganizationState {
    const healthy =
      this.started &&
      this.activeDepartmentIds().length > 0 &&
      this.activeFactoryIds().length > 0 &&
      this.listWorkers().length > 0;
    this.organizationState = healthy ? "synchronized" : "degraded";
    return this.organizationState;
  }
}

let sessionSequence = 0;
let messageSequence = 0;

export function resetRegistrySequencesForTesting() {
  sessionSequence = 0;
  messageSequence = 0;
}

function filterById<T>(items: T[], query: string | null | undefined, idOf: (item: T) => string) {
  if (!query?.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    const id = idOf(item).toLowerCase();
    return id === q || id.includes(q);
  });
}
