import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  CapabilityCatalogEntry,
  DepartmentRecord,
  RegisterWorkerInput,
  SkillCatalogEntry,
  ToolCatalogEntry,
} from "./types.js";

export type WorkforceCapabilityRegistryConfiguration = {
  enabled: boolean;
  registrationRulesEnabled: boolean;
  lookupRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  seedWorkers: RegisterWorkerInput[];
  seedDepartments: DepartmentRecord[];
  seedCapabilities: CapabilityCatalogEntry[];
  seedTools: ToolCatalogEntry[];
  seedSkills: SkillCatalogEntry[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-10 hard boundaries — force-locked true. */
  neverExecuteWork: true;
  neverAssignWorkers: true;
  neverOrchestrateWorkers: true;
  neverApproveActions: true;
  neverReplacePillow: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveRegistryTraceability: true;
  preserveAuditability: true;
  preserveRegistryIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_DEPARTMENTS: DepartmentRecord[] = [
  { departmentId: "dept-strategy", name: "strategy", description: "Strategic planning and option framing" },
  { departmentId: "dept-product", name: "product", description: "Product definition and roadmap alignment" },
  { departmentId: "dept-engineering", name: "engineering", description: "Technical delivery and integration" },
  { departmentId: "dept-operations", name: "operations", description: "Operational coordination and monitoring" },
  { departmentId: "dept-finance", name: "finance", description: "Cost, budget, and value tracking" },
  { departmentId: "dept-compliance", name: "compliance", description: "Policy and governance controls" },
  { departmentId: "dept-security", name: "security", description: "Security review and control verification" },
  { departmentId: "dept-data", name: "data_intelligence", description: "Signal analysis and insight packaging" },
  { departmentId: "dept-governance", name: "executive_governance", description: "Escalation and executive reporting" },
];

export const DEFAULT_SEED_CAPABILITIES: CapabilityCatalogEntry[] = [
  { capabilityId: "cap-intent-decomposition", name: "intent_decomposition", description: "Decompose executive intent" },
  { capabilityId: "cap-implementation-planning", name: "implementation_planning", description: "Plan technical implementation" },
  { capabilityId: "cap-process-coordination", name: "process_coordination", description: "Coordinate operational processes" },
  { capabilityId: "cap-policy-checks", name: "policy_checks", description: "Perform policy compliance checks" },
  { capabilityId: "cap-threat-review", name: "threat_review", description: "Review security threats" },
  { capabilityId: "cap-signal-analysis", name: "signal_analysis", description: "Analyse operational signals" },
  { capabilityId: "cap-budget-alignment", name: "budget_alignment", description: "Align actions to budget constraints" },
  { capabilityId: "cap-escalation-routing", name: "escalation_routing", description: "Route escalations to governance" },
];

export const DEFAULT_SEED_TOOLS: ToolCatalogEntry[] = [
  { toolId: "tool-planner", name: "mission_planner", description: "Mission planning surface" },
  { toolId: "tool-repo-reader", name: "repository_reader", description: "Read-only repository inspection" },
  { toolId: "tool-metrics", name: "metrics_console", description: "Operational metrics console" },
  { toolId: "tool-policy", name: "policy_checker", description: "Policy verification tool" },
  { toolId: "tool-security", name: "security_scanner", description: "Security scanning tool" },
  { toolId: "tool-finance", name: "finance_ledger", description: "Finance and budget ledger" },
];

export const DEFAULT_SEED_SKILLS: SkillCatalogEntry[] = [
  { skillId: "skill-structuring", name: "structured_reasoning", description: "Structured reasoning skill" },
  { skillId: "skill-coordination", name: "cross_team_coordination", description: "Cross-team coordination skill" },
  { skillId: "skill-risk", name: "risk_assessment", description: "Risk assessment skill" },
  { skillId: "skill-reporting", name: "executive_reporting", description: "Executive reporting skill" },
  { skillId: "skill-integration", name: "systems_integration", description: "Systems integration skill" },
];

export const DEFAULT_SEED_WORKERS: RegisterWorkerInput[] = [
  {
    workerId: "wcr-wkr-strategy-01",
    workerName: "Strategy Specialist",
    department: "strategy",
    workerType: "specialist",
    capabilityList: ["intent_decomposition", "priority_framing", "option_synthesis"],
    skillList: ["structured_reasoning", "executive_reporting"],
    approvedTools: ["mission_planner", "repository_reader"],
    dependencies: [],
    operatingLimits: {
      maxConcurrentMissions: 3,
      requiredApprovals: ["pillow_approval"],
      allowedTools: ["mission_planner", "repository_reader"],
      securityRestrictions: ["no_secret_exfiltration", "read_only_repo"],
    },
    currentStatus: "available",
    version: "1.0.0",
    validated: true,
  },
  {
    workerId: "wcr-wkr-engineering-01",
    workerName: "Engineering Specialist",
    department: "engineering",
    workerType: "specialist",
    capabilityList: ["implementation_planning", "integration_coordination", "technical_delivery"],
    skillList: ["systems_integration", "structured_reasoning"],
    approvedTools: ["repository_reader", "metrics_console", "mission_planner"],
    dependencies: ["wcr-wkr-product-01"],
    operatingLimits: {
      maxConcurrentMissions: 4,
      requiredApprovals: ["pillow_approval"],
      allowedTools: ["repository_reader", "metrics_console", "mission_planner"],
      securityRestrictions: ["no_production_write_without_approval"],
    },
    currentStatus: "available",
    version: "1.0.0",
    validated: true,
  },
  {
    workerId: "wcr-wkr-product-01",
    workerName: "Product Specialist",
    department: "product",
    workerType: "analyst",
    capabilityList: ["requirements_structuring", "roadmap_alignment", "experience_definition"],
    skillList: ["structured_reasoning", "cross_team_coordination"],
    approvedTools: ["mission_planner", "metrics_console"],
    dependencies: [],
    operatingLimits: {
      maxConcurrentMissions: 3,
      requiredApprovals: ["pillow_approval"],
      allowedTools: ["mission_planner", "metrics_console"],
      securityRestrictions: ["no_secret_exfiltration"],
    },
    currentStatus: "available",
    version: "1.0.0",
    validated: true,
  },
  {
    workerId: "wcr-wkr-operations-01",
    workerName: "Operations Coordinator",
    department: "operations",
    workerType: "coordinator",
    capabilityList: ["process_coordination", "handoff_management", "runtime_monitoring"],
    skillList: ["cross_team_coordination", "executive_reporting"],
    approvedTools: ["metrics_console", "mission_planner"],
    dependencies: ["wcr-wkr-engineering-01"],
    operatingLimits: {
      maxConcurrentMissions: 5,
      requiredApprovals: ["pillow_approval"],
      allowedTools: ["metrics_console", "mission_planner"],
      securityRestrictions: ["monitoring_only_by_default"],
    },
    currentStatus: "available",
    version: "1.0.0",
    validated: true,
  },
  {
    workerId: "wcr-wkr-compliance-01",
    workerName: "Compliance Reviewer",
    department: "compliance",
    workerType: "reviewer",
    capabilityList: ["policy_checks", "governance_alignment", "risk_controls"],
    skillList: ["risk_assessment", "executive_reporting"],
    approvedTools: ["policy_checker", "repository_reader"],
    dependencies: [],
    operatingLimits: {
      maxConcurrentMissions: 2,
      requiredApprovals: ["pillow_approval", "grand_king_approval"],
      allowedTools: ["policy_checker", "repository_reader"],
      securityRestrictions: ["no_policy_bypass", "audit_all_checks"],
    },
    currentStatus: "available",
    version: "1.0.0",
    validated: true,
  },
  {
    workerId: "wcr-wkr-security-01",
    workerName: "Security Specialist",
    department: "security",
    workerType: "specialist",
    capabilityList: ["threat_review", "control_verification", "secure_handoff"],
    skillList: ["risk_assessment", "systems_integration"],
    approvedTools: ["security_scanner", "policy_checker", "repository_reader"],
    dependencies: ["wcr-wkr-compliance-01"],
    operatingLimits: {
      maxConcurrentMissions: 2,
      requiredApprovals: ["grand_king_approval"],
      allowedTools: ["security_scanner", "policy_checker", "repository_reader"],
      securityRestrictions: ["no_credential_exposure", "quarantine_on_critical_finding"],
    },
    currentStatus: "available",
    version: "1.0.0",
    validated: true,
  },
  {
    workerId: "wcr-wkr-finance-01",
    workerName: "Finance Analyst",
    department: "finance",
    workerType: "analyst",
    capabilityList: ["cost_estimation", "budget_alignment", "value_tracking"],
    skillList: ["structured_reasoning", "executive_reporting"],
    approvedTools: ["finance_ledger", "metrics_console"],
    dependencies: [],
    operatingLimits: {
      maxConcurrentMissions: 3,
      requiredApprovals: ["pillow_approval"],
      allowedTools: ["finance_ledger", "metrics_console"],
      securityRestrictions: ["no_ledger_mutation_without_approval"],
    },
    currentStatus: "available",
    version: "1.0.0",
    validated: true,
  },
  {
    workerId: "wcr-wkr-data-01",
    workerName: "Data Intelligence Operator",
    department: "data_intelligence",
    workerType: "operator",
    capabilityList: ["signal_analysis", "metric_aggregation", "insight_packaging"],
    skillList: ["structured_reasoning", "systems_integration"],
    approvedTools: ["metrics_console", "repository_reader"],
    dependencies: [],
    operatingLimits: {
      maxConcurrentMissions: 4,
      requiredApprovals: ["pillow_approval"],
      allowedTools: ["metrics_console", "repository_reader"],
      securityRestrictions: ["aggregate_only_pii_policy"],
    },
    currentStatus: "available",
    version: "1.0.0",
    validated: true,
  },
];

export const DEFAULT_WORKFORCE_CAPABILITY_REGISTRY_CONFIGURATION: WorkforceCapabilityRegistryConfiguration = {
  enabled: true,
  registrationRulesEnabled: true,
  lookupRulesEnabled: true,
  validationRulesEnabled: true,
  seedWorkers: DEFAULT_SEED_WORKERS.map((w) => ({
    ...w,
    capabilityList: [...(w.capabilityList ?? [])],
    skillList: [...(w.skillList ?? [])],
    approvedTools: [...(w.approvedTools ?? [])],
    dependencies: [...(w.dependencies ?? [])],
    operatingLimits: w.operatingLimits
      ? {
          maxConcurrentMissions: w.operatingLimits.maxConcurrentMissions ?? 1,
          requiredApprovals: [...(w.operatingLimits.requiredApprovals ?? [])],
          allowedTools: [...(w.operatingLimits.allowedTools ?? [])],
          securityRestrictions: [...(w.operatingLimits.securityRestrictions ?? [])],
        }
      : undefined,
  })),
  seedDepartments: DEFAULT_SEED_DEPARTMENTS.map((d) => ({ ...d })),
  seedCapabilities: DEFAULT_SEED_CAPABILITIES.map((c) => ({ ...c })),
  seedTools: DEFAULT_SEED_TOOLS.map((t) => ({ ...t })),
  seedSkills: DEFAULT_SEED_SKILLS.map((s) => ({ ...s })),
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWork: true,
  neverAssignWorkers: true,
  neverOrchestrateWorkers: true,
  neverApproveActions: true,
  neverReplacePillow: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveRegistryTraceability: true,
  preserveAuditability: true,
  preserveRegistryIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildWorkforceCapabilityRegistryConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkforceCapabilityRegistryConfiguration> = {},
): WorkforceCapabilityRegistryConfiguration {
  let file: Partial<WorkforceCapabilityRegistryConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "workforce-capability-registry.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKFORCE_CAPABILITY_REGISTRY_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKFORCE_CAPABILITY_REGISTRY_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_WORKFORCE_CAPABILITY_REGISTRY_CONFIGURATION,
    ...file,
    ...overrides,
    seedWorkers:
      overrides.seedWorkers ??
      file.seedWorkers ??
      DEFAULT_WORKFORCE_CAPABILITY_REGISTRY_CONFIGURATION.seedWorkers.map((w) => ({
        ...w,
        capabilityList: [...(w.capabilityList ?? [])],
        skillList: [...(w.skillList ?? [])],
        approvedTools: [...(w.approvedTools ?? [])],
        dependencies: [...(w.dependencies ?? [])],
      })),
    seedDepartments:
      overrides.seedDepartments ??
      file.seedDepartments ??
      DEFAULT_WORKFORCE_CAPABILITY_REGISTRY_CONFIGURATION.seedDepartments.map((d) => ({ ...d })),
    seedCapabilities:
      overrides.seedCapabilities ??
      file.seedCapabilities ??
      DEFAULT_WORKFORCE_CAPABILITY_REGISTRY_CONFIGURATION.seedCapabilities.map((c) => ({ ...c })),
    seedTools:
      overrides.seedTools ??
      file.seedTools ??
      DEFAULT_WORKFORCE_CAPABILITY_REGISTRY_CONFIGURATION.seedTools.map((t) => ({ ...t })),
    seedSkills:
      overrides.seedSkills ??
      file.seedSkills ??
      DEFAULT_WORKFORCE_CAPABILITY_REGISTRY_CONFIGURATION.seedSkills.map((s) => ({ ...s })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWork: true,
    neverAssignWorkers: true,
    neverOrchestrateWorkers: true,
    neverApproveActions: true,
    neverReplacePillow: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveRegistryTraceability: true,
    preserveAuditability: true,
    preserveRegistryIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
