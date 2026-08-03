import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROUTING_FACTORS } from "./paths.js";
import type { RoutableTool, RoutableWorker } from "./types.js";

export type SkillToolRouterConfiguration = {
  enabled: boolean;
  routingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  routingFactors: string[];
  workerCatalog: RoutableWorker[];
  toolCatalog: RoutableTool[];
  capabilityKeywords: Record<string, string[]>;
  escalationConfidenceThreshold: number;
  multiWorkerCapabilityThreshold: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-12 hard boundaries — force-locked true. */
  neverExecuteWork: true;
  neverPerformOrchestration: true;
  neverReplaceWorkers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveRoutingTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

/** WCR-aligned worker routing catalog (query surface for Q0-12). */
export const DEFAULT_WORKER_CATALOG: RoutableWorker[] = [
  {
    workerId: "wcr-wkr-strategy-01",
    workerName: "Strategy Specialist",
    department: "strategy",
    capabilities: ["intent_decomposition", "priority_framing", "option_synthesis"],
    skills: ["structured_reasoning", "executive_reporting"],
    approvedTools: ["mission_planner", "repository_reader"],
    availability: "available",
    performanceScore: 88,
    authorityLevel: 70,
    costProfile: "medium",
    securityClearance: "standard",
  },
  {
    workerId: "wcr-wkr-engineering-01",
    workerName: "Engineering Specialist",
    department: "engineering",
    capabilities: ["implementation_planning", "integration_coordination", "technical_delivery"],
    skills: ["systems_integration", "structured_reasoning"],
    approvedTools: ["repository_reader", "metrics_console", "mission_planner"],
    availability: "available",
    performanceScore: 92,
    authorityLevel: 65,
    costProfile: "medium",
    securityClearance: "elevated",
  },
  {
    workerId: "wcr-wkr-product-01",
    workerName: "Product Specialist",
    department: "product",
    capabilities: ["requirements_structuring", "roadmap_alignment", "experience_definition"],
    skills: ["structured_reasoning", "cross_team_coordination"],
    approvedTools: ["mission_planner", "metrics_console"],
    availability: "available",
    performanceScore: 85,
    authorityLevel: 60,
    costProfile: "low",
    securityClearance: "standard",
  },
  {
    workerId: "wcr-wkr-operations-01",
    workerName: "Operations Coordinator",
    department: "operations",
    capabilities: ["process_coordination", "handoff_management", "runtime_monitoring"],
    skills: ["cross_team_coordination", "executive_reporting"],
    approvedTools: ["metrics_console", "mission_planner"],
    availability: "available",
    performanceScore: 87,
    authorityLevel: 55,
    costProfile: "low",
    securityClearance: "standard",
  },
  {
    workerId: "wcr-wkr-compliance-01",
    workerName: "Compliance Reviewer",
    department: "compliance",
    capabilities: ["policy_checks", "governance_alignment", "risk_controls"],
    skills: ["risk_assessment", "executive_reporting"],
    approvedTools: ["policy_checker", "repository_reader"],
    availability: "available",
    performanceScore: 90,
    authorityLevel: 85,
    costProfile: "medium",
    securityClearance: "restricted",
  },
  {
    workerId: "wcr-wkr-security-01",
    workerName: "Security Specialist",
    department: "security",
    capabilities: ["threat_review", "control_verification", "secure_handoff"],
    skills: ["risk_assessment", "systems_integration"],
    approvedTools: ["security_scanner", "policy_checker", "repository_reader"],
    availability: "available",
    performanceScore: 93,
    authorityLevel: 90,
    costProfile: "high",
    securityClearance: "restricted",
  },
  {
    workerId: "wcr-wkr-finance-01",
    workerName: "Finance Analyst",
    department: "finance",
    capabilities: ["cost_estimation", "budget_alignment", "value_tracking"],
    skills: ["structured_reasoning", "executive_reporting"],
    approvedTools: ["finance_ledger", "metrics_console"],
    availability: "available",
    performanceScore: 86,
    authorityLevel: 70,
    costProfile: "medium",
    securityClearance: "elevated",
  },
  {
    workerId: "wcr-wkr-data-01",
    workerName: "Data Intelligence Operator",
    department: "data_intelligence",
    capabilities: ["signal_analysis", "metric_aggregation", "insight_packaging"],
    skills: ["structured_reasoning", "systems_integration"],
    approvedTools: ["metrics_console", "repository_reader"],
    availability: "available",
    performanceScore: 89,
    authorityLevel: 55,
    costProfile: "low",
    securityClearance: "standard",
  },
];

export const DEFAULT_TOOL_CATALOG: RoutableTool[] = [
  {
    toolId: "tool-planner",
    toolName: "mission_planner",
    compatibleCapabilities: ["intent_decomposition", "implementation_planning", "roadmap_alignment", "process_coordination"],
    availability: "available",
    securityRating: "standard",
    costProfile: "low",
  },
  {
    toolId: "tool-repo-reader",
    toolName: "repository_reader",
    compatibleCapabilities: ["implementation_planning", "technical_delivery", "policy_checks", "threat_review", "signal_analysis"],
    availability: "available",
    securityRating: "elevated",
    costProfile: "low",
  },
  {
    toolId: "tool-metrics",
    toolName: "metrics_console",
    compatibleCapabilities: ["runtime_monitoring", "metric_aggregation", "signal_analysis", "value_tracking"],
    availability: "available",
    securityRating: "standard",
    costProfile: "low",
  },
  {
    toolId: "tool-policy",
    toolName: "policy_checker",
    compatibleCapabilities: ["policy_checks", "governance_alignment", "risk_controls", "control_verification"],
    availability: "available",
    securityRating: "restricted",
    costProfile: "medium",
  },
  {
    toolId: "tool-security",
    toolName: "security_scanner",
    compatibleCapabilities: ["threat_review", "control_verification", "secure_handoff"],
    availability: "available",
    securityRating: "restricted",
    costProfile: "high",
  },
  {
    toolId: "tool-finance",
    toolName: "finance_ledger",
    compatibleCapabilities: ["cost_estimation", "budget_alignment", "value_tracking"],
    availability: "available",
    securityRating: "elevated",
    costProfile: "medium",
  },
];

export const DEFAULT_CAPABILITY_KEYWORDS: Record<string, string[]> = {
  intent_decomposition: ["strategy", "intent", "priority", "option", "plan"],
  implementation_planning: ["implement", "engineering", "build", "integrate", "technical", "code"],
  technical_delivery: ["deliver", "ship", "deploy", "implementation"],
  requirements_structuring: ["product", "requirement", "roadmap", "experience"],
  process_coordination: ["operations", "coordinate", "handoff", "runtime", "monitor"],
  policy_checks: ["compliance", "policy", "governance", "audit"],
  threat_review: ["security", "threat", "vulnerability", "secure"],
  cost_estimation: ["finance", "cost", "budget", "spend", "value"],
  signal_analysis: ["data", "metric", "signal", "insight", "analytics"],
  risk_controls: ["risk", "control", "mitigation"],
};

export const DEFAULT_SKILL_TOOL_ROUTER_CONFIGURATION: SkillToolRouterConfiguration = {
  enabled: true,
  routingRulesEnabled: true,
  validationRulesEnabled: true,
  routingFactors: [...ROUTING_FACTORS],
  workerCatalog: DEFAULT_WORKER_CATALOG.map((w) => ({
    ...w,
    capabilities: [...w.capabilities],
    skills: [...w.skills],
    approvedTools: [...w.approvedTools],
  })),
  toolCatalog: DEFAULT_TOOL_CATALOG.map((t) => ({
    ...t,
    compatibleCapabilities: [...t.compatibleCapabilities],
  })),
  capabilityKeywords: { ...DEFAULT_CAPABILITY_KEYWORDS },
  escalationConfidenceThreshold: 55,
  multiWorkerCapabilityThreshold: 3,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWork: true,
  neverPerformOrchestration: true,
  neverReplaceWorkers: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveRoutingTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildSkillToolRouterConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SkillToolRouterConfiguration> = {},
): SkillToolRouterConfiguration {
  let file: Partial<SkillToolRouterConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "skill-tool-router.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SKILL_TOOL_ROUTER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.SKILL_TOOL_ROUTER_RETRY_ATTEMPTS ?? "", 10);

  const mergedFactors = Array.from(
    new Set([
      ...DEFAULT_SKILL_TOOL_ROUTER_CONFIGURATION.routingFactors,
      ...(file.routingFactors ?? []),
      ...(overrides.routingFactors ?? []),
    ]),
  );

  return {
    ...DEFAULT_SKILL_TOOL_ROUTER_CONFIGURATION,
    ...file,
    ...overrides,
    routingFactors: mergedFactors,
    workerCatalog: (overrides.workerCatalog ??
      file.workerCatalog ??
      DEFAULT_SKILL_TOOL_ROUTER_CONFIGURATION.workerCatalog).map((w) => ({
      ...w,
      capabilities: [...w.capabilities],
      skills: [...w.skills],
      approvedTools: [...w.approvedTools],
    })),
    toolCatalog: (overrides.toolCatalog ??
      file.toolCatalog ??
      DEFAULT_SKILL_TOOL_ROUTER_CONFIGURATION.toolCatalog).map((t) => ({
      ...t,
      compatibleCapabilities: [...t.compatibleCapabilities],
    })),
    capabilityKeywords: {
      ...DEFAULT_SKILL_TOOL_ROUTER_CONFIGURATION.capabilityKeywords,
      ...(file.capabilityKeywords ?? {}),
      ...(overrides.capabilityKeywords ?? {}),
    },
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWork: true,
    neverPerformOrchestration: true,
    neverReplaceWorkers: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveRoutingTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
