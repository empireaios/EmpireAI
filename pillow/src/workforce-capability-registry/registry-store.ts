import { WCR_METADATA_VERSION } from "./paths.js";
import type {
  CapabilityCatalogEntry,
  DepartmentRecord,
  OperatingLimits,
  RegisterCatalogInput,
  RegisterWorkerInput,
  RegistryRecord,
  SkillCatalogEntry,
  ToolCatalogEntry,
  UpdateWorkerStatusInput,
  ValidationStatus,
  WorkerStatus,
} from "./types.js";

let registrySequence = 0;

const DEFAULT_LIMITS: OperatingLimits = {
  maxConcurrentMissions: 1,
  requiredApprovals: ["pillow_approval"],
  allowedTools: [],
  securityRestrictions: ["no_secret_exfiltration"],
};

/** Authoritative in-memory capability store — register/store/update only. */
export class RegistryStore {
  private workers = new Map<string, RegistryRecord>();
  private departments = new Map<string, DepartmentRecord>();
  private capabilities = new Map<string, CapabilityCatalogEntry>();
  private tools = new Map<string, ToolCatalogEntry>();
  private skills = new Map<string, SkillCatalogEntry>();

  seed(input: {
    workers: RegisterWorkerInput[];
    departments: DepartmentRecord[];
    capabilities: CapabilityCatalogEntry[];
    tools: ToolCatalogEntry[];
    skills: SkillCatalogEntry[];
  }) {
    for (const department of input.departments) this.departments.set(department.departmentId, { ...department });
    for (const capability of input.capabilities) this.capabilities.set(capability.capabilityId, { ...capability });
    for (const tool of input.tools) this.tools.set(tool.toolId, { ...tool });
    for (const skill of input.skills) this.skills.set(skill.skillId, { ...skill });
    for (const worker of input.workers) this.registerWorker(worker, "passed");
  }

  registerWorker(input: RegisterWorkerInput, validationStatus: ValidationStatus): RegistryRecord {
    registrySequence += 1;
    const now = new Date().toISOString();
    const existing = this.workers.get(input.workerId);
    const limits = normalizeLimits(input.operatingLimits, input.approvedTools);
    const record: RegistryRecord = {
      registryId: existing?.registryId ?? `wcr-reg-${Date.now()}-${registrySequence}`,
      workerId: input.workerId.trim(),
      workerName: input.workerName.trim(),
      department: input.department.trim(),
      workerType: (input.workerType ?? "specialist").trim() || "specialist",
      capabilityList: unique(input.capabilityList ?? []),
      skillList: unique(input.skillList ?? []),
      approvedTools: unique(input.approvedTools ?? limits.allowedTools),
      dependencies: unique(input.dependencies ?? []),
      operatingLimits: limits,
      currentStatus: input.currentStatus ?? existing?.currentStatus ?? "available",
      version: input.version?.trim() || existing?.version || "1.0.0",
      lastUpdated: now,
      metadataVersion: WCR_METADATA_VERSION,
      registryTraceId: `wcr-trace-${Date.now()}-${registrySequence}`,
      validationStatus,
      neverExecuteWork: true,
      neverAssignWorkers: true,
      neverOrchestrateWorkers: true,
      neverApproveActions: true,
      neverReplacePillow: true,
      workExecuted: false,
      workersAssigned: false,
      workersOrchestrated: false,
      actionsApproved: false,
      pillowReplaced: false,
      preserveRegistryTraceability: true,
      preserveAuditability: true,
      preserveRegistryIntegrity: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    this.workers.set(record.workerId, record);
    this.ensureDepartmentName(record.department);
    for (const capability of record.capabilityList) this.ensureCapabilityName(capability);
    for (const tool of record.approvedTools) this.ensureToolName(tool);
    for (const skill of record.skillList) this.ensureSkillName(skill);
    return this.cloneWorker(record);
  }

  registerDepartment(input: RegisterCatalogInput): DepartmentRecord {
    const record: DepartmentRecord = {
      departmentId: input.id.trim(),
      name: input.name.trim(),
      description: (input.description ?? input.name).trim(),
    };
    this.departments.set(record.departmentId, record);
    return { ...record };
  }

  registerCapability(input: RegisterCatalogInput): CapabilityCatalogEntry {
    const record: CapabilityCatalogEntry = {
      capabilityId: input.id.trim(),
      name: input.name.trim(),
      description: (input.description ?? input.name).trim(),
    };
    this.capabilities.set(record.capabilityId, record);
    return { ...record };
  }

  registerTool(input: RegisterCatalogInput): ToolCatalogEntry {
    const record: ToolCatalogEntry = {
      toolId: input.id.trim(),
      name: input.name.trim(),
      description: (input.description ?? input.name).trim(),
    };
    this.tools.set(record.toolId, record);
    return { ...record };
  }

  registerSkill(input: RegisterCatalogInput): SkillCatalogEntry {
    const record: SkillCatalogEntry = {
      skillId: input.id.trim(),
      name: input.name.trim(),
      description: (input.description ?? input.name).trim(),
    };
    this.skills.set(record.skillId, record);
    return { ...record };
  }

  updateStatus(input: UpdateWorkerStatusInput, validationStatus: ValidationStatus): RegistryRecord | null {
    const existing = this.workers.get(input.workerId);
    if (!existing) return null;
    const updated: RegistryRecord = {
      ...existing,
      currentStatus: input.currentStatus,
      lastUpdated: new Date().toISOString(),
      validationStatus,
      capabilityList: [...existing.capabilityList],
      skillList: [...existing.skillList],
      approvedTools: [...existing.approvedTools],
      dependencies: [...existing.dependencies],
      operatingLimits: {
        ...existing.operatingLimits,
        requiredApprovals: [...existing.operatingLimits.requiredApprovals],
        allowedTools: [...existing.operatingLimits.allowedTools],
        securityRestrictions: [...existing.operatingLimits.securityRestrictions],
      },
    };
    this.workers.set(updated.workerId, updated);
    return this.cloneWorker(updated);
  }

  listWorkers() {
    return [...this.workers.values()].map((w) => this.cloneWorker(w));
  }

  getWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    return worker ? this.cloneWorker(worker) : null;
  }

  listDepartments() {
    return [...this.departments.values()].map((d) => ({ ...d }));
  }

  listCapabilities() {
    return [...this.capabilities.values()].map((c) => ({ ...c }));
  }

  listTools() {
    return [...this.tools.values()].map((t) => ({ ...t }));
  }

  listSkills() {
    return [...this.skills.values()].map((s) => ({ ...s }));
  }

  private ensureDepartmentName(name: string) {
    const key = `dept-${name}`;
    if (![...this.departments.values()].some((d) => d.name === name)) {
      this.departments.set(key, { departmentId: key, name, description: `${name} department` });
    }
  }

  private ensureCapabilityName(name: string) {
    if (![...this.capabilities.values()].some((c) => c.name === name)) {
      const id = `cap-${name}`;
      this.capabilities.set(id, { capabilityId: id, name, description: `${name} capability` });
    }
  }

  private ensureToolName(name: string) {
    if (![...this.tools.values()].some((t) => t.name === name)) {
      const id = `tool-${name}`;
      this.tools.set(id, { toolId: id, name, description: `${name} tool` });
    }
  }

  private ensureSkillName(name: string) {
    if (![...this.skills.values()].some((s) => s.name === name)) {
      const id = `skill-${name}`;
      this.skills.set(id, { skillId: id, name, description: `${name} skill` });
    }
  }

  private cloneWorker(record: RegistryRecord): RegistryRecord {
    return {
      ...record,
      capabilityList: [...record.capabilityList],
      skillList: [...record.skillList],
      approvedTools: [...record.approvedTools],
      dependencies: [...record.dependencies],
      operatingLimits: {
        maxConcurrentMissions: record.operatingLimits.maxConcurrentMissions,
        requiredApprovals: [...record.operatingLimits.requiredApprovals],
        allowedTools: [...record.operatingLimits.allowedTools],
        securityRestrictions: [...record.operatingLimits.securityRestrictions],
      },
    };
  }
}

export function resetRegistrySequenceForTesting() {
  registrySequence = 0;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function normalizeLimits(
  limits: Partial<OperatingLimits> | undefined,
  approvedTools?: string[],
): OperatingLimits {
  return {
    maxConcurrentMissions: limits?.maxConcurrentMissions ?? DEFAULT_LIMITS.maxConcurrentMissions,
    requiredApprovals: unique(limits?.requiredApprovals ?? DEFAULT_LIMITS.requiredApprovals),
    allowedTools: unique(limits?.allowedTools ?? approvedTools ?? DEFAULT_LIMITS.allowedTools),
    securityRestrictions: unique(limits?.securityRestrictions ?? DEFAULT_LIMITS.securityRestrictions),
  };
}

export type { WorkerStatus };
