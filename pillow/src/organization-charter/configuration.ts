import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUTHORITY_LEVELS,
  CHARTER_VERSION,
  ORGANIZATIONAL_RULES,
} from "./paths.js";
import type {
  DepartmentDefinition,
  FactoryDefinition,
  OrganizationStructureRecord,
  WorkerOwnership,
} from "./types.js";

export type OrganizationCharterConfiguration = {
  enabled: boolean;
  definitionRulesEnabled: boolean;
  registrationRulesEnabled: boolean;
  reportingRulesEnabled: boolean;
  escalationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  charterVersion: string;
  executiveAuthority: "pillow";
  organizationalRules: string[];
  authorityLevels: string[];
  collaborationRules: string[];
  governanceRules: string[];
  seedFactories: FactoryDefinition[];
  seedDepartments: DepartmentDefinition[];
  seedWorkers: WorkerOwnership[];
  seedStructureRecords: OrganizationStructureRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-02 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkforceOperatingSystem: true;
  neverReplaceWorkforceOrchestrator: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveAuditability: true;
  preserveTraceability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_FACTORIES: FactoryDefinition[] = [
  {
    factoryId: "executive-intelligence-factory",
    name: "Executive Intelligence Factory",
    responsibilities: [
      "executive_planning",
      "executive_governance",
      "executive_reporting",
      "workforce_certification",
    ],
    reportsTo: "pillow",
  },
  {
    factoryId: "workforce-factory-foundation",
    name: "Workforce Factory Foundation",
    responsibilities: [
      "worker_constitution",
      "organization_charter",
      "department_operations",
      "workforce_standardization",
    ],
    reportsTo: "pillow",
  },
];

export const DEFAULT_SEED_DEPARTMENTS: DepartmentDefinition[] = [
  {
    departmentId: "planning",
    name: "Planning",
    factoryId: "executive-intelligence-factory",
    responsibilities: ["mission_planning", "opportunity_scanning"],
    reportsTo: "executive-intelligence-factory",
  },
  {
    departmentId: "governance",
    name: "Governance",
    factoryId: "executive-intelligence-factory",
    responsibilities: ["audit", "approvals", "escalation"],
    reportsTo: "executive-intelligence-factory",
  },
  {
    departmentId: "reporting",
    name: "Reporting",
    factoryId: "executive-intelligence-factory",
    responsibilities: ["executive_summaries", "progress_aggregation"],
    reportsTo: "executive-intelligence-factory",
  },
  {
    departmentId: "strategy",
    name: "Strategy",
    factoryId: "workforce-factory-foundation",
    responsibilities: ["strategic_analysis", "worker_constitution_compliance"],
    reportsTo: "workforce-factory-foundation",
  },
  {
    departmentId: "operations",
    name: "Operations",
    factoryId: "workforce-factory-foundation",
    responsibilities: ["task_execution_support", "coordination"],
    reportsTo: "workforce-factory-foundation",
  },
  {
    departmentId: "quality",
    name: "Quality",
    factoryId: "workforce-factory-foundation",
    responsibilities: ["quality_standard", "self_critique", "peer_review"],
    reportsTo: "workforce-factory-foundation",
  },
];

export const DEFAULT_ORGANIZATION_CHARTER_CONFIGURATION: OrganizationCharterConfiguration =
  {
    enabled: true,
    definitionRulesEnabled: true,
    registrationRulesEnabled: true,
    reportingRulesEnabled: true,
    escalationRulesEnabled: true,
    validationRulesEnabled: true,
    charterVersion: CHARTER_VERSION,
    executiveAuthority: "pillow",
    organizationalRules: [...ORGANIZATIONAL_RULES],
    authorityLevels: [...AUTHORITY_LEVELS],
    collaborationRules: [
      "cross_department_requests_via_messaging",
      "shared_knowledge_via_knowledge_sharing_bus",
      "mission_coordination_for_multi_department_work",
    ],
    governanceRules: [
      "pillow_is_sole_executive_authority",
      "no_shadow_organizations",
      "all_entities_register_under_charter",
      "escalation_unresolved_reaches_pillow",
    ],
    seedFactories: DEFAULT_SEED_FACTORIES,
    seedDepartments: DEFAULT_SEED_DEPARTMENTS,
    seedWorkers: [],
    seedStructureRecords: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceOperatingSystem: true,
    neverReplaceWorkforceOrchestrator: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildOrganizationCharterConfiguration(
  repositoryRoot?: string,
  overrides: Partial<OrganizationCharterConfiguration> = {},
): OrganizationCharterConfiguration {
  let file: Partial<OrganizationCharterConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "organization-charter.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.ORGANIZATION_CHARTER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.ORGANIZATION_CHARTER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: keyof OrganizationCharterConfiguration) =>
    Array.from(
      new Set([
        ...((DEFAULT_ORGANIZATION_CHARTER_CONFIGURATION[key] as string[]) ?? []),
        ...((file[key] as string[] | undefined) ?? []),
        ...((overrides[key] as string[] | undefined) ?? []),
      ]),
    );

  return {
    ...DEFAULT_ORGANIZATION_CHARTER_CONFIGURATION,
    ...file,
    ...overrides,
    executiveAuthority: "pillow",
    organizationalRules: mergeList("organizationalRules"),
    authorityLevels: mergeList("authorityLevels"),
    collaborationRules: mergeList("collaborationRules"),
    governanceRules: mergeList("governanceRules"),
    seedFactories: (overrides.seedFactories ??
      file.seedFactories ??
      DEFAULT_SEED_FACTORIES
    ).map((f) => ({ ...f, responsibilities: [...f.responsibilities], reportsTo: "pillow" as const })),
    seedDepartments: (overrides.seedDepartments ??
      file.seedDepartments ??
      DEFAULT_SEED_DEPARTMENTS
    ).map((d) => ({ ...d, responsibilities: [...d.responsibilities] })),
    seedWorkers: (overrides.seedWorkers ?? file.seedWorkers ?? []).map((w) => ({ ...w })),
    seedStructureRecords: (
      overrides.seedStructureRecords ??
      file.seedStructureRecords ??
      []
    ).map((r) => ({
      ...r,
      factoriesRegistered: [...r.factoriesRegistered],
      departmentsRegistered: [...r.departmentsRegistered],
      workersRegistered: [...r.workersRegistered],
      rulesApplied: [...r.rulesApplied],
      rulesSatisfied: [...r.rulesSatisfied],
      rulesFailed: [...r.rulesFailed],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkforceOperatingSystem: true,
    neverReplaceWorkforceOrchestrator: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveAuditability: true,
    preserveTraceability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
