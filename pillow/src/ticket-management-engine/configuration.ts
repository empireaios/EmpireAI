/** R4-09 — Externalized Ticket Management Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "./paths.js";

export type ClassificationRule = {
  ruleId: string;
  label: string;
  category: (typeof TICKET_CATEGORIES)[number];
  keywords: string[];
  enabled: boolean;
};

export type PriorityRule = {
  ruleId: string;
  label: string;
  priority: (typeof TICKET_PRIORITIES)[number];
  categories: string[];
  enabled: boolean;
};

export type AssignmentRule = {
  ruleId: string;
  label: string;
  defaultOwner: string;
  categories: string[];
  maxTicketsPerOwner: number;
  enabled: boolean;
};

export type EscalationRule = {
  ruleId: string;
  label: string;
  escalatePriorities: string[];
  enabled: boolean;
};

export type TicketManagementEngineConfiguration = {
  enabled: boolean;
  classificationRulesEnabled: boolean;
  priorityRulesEnabled: boolean;
  assignmentRulesEnabled: boolean;
  escalationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  overdueThresholdHours: number;
  stalledThresholdHours: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  classificationRules: ClassificationRule[];
  priorityRules: PriorityRule[];
  assignmentRules: AssignmentRule[];
  escalationRules: EscalationRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION: TicketManagementEngineConfiguration =
  {
    enabled: true,
    classificationRulesEnabled: true,
    priorityRulesEnabled: true,
    assignmentRulesEnabled: true,
    escalationRulesEnabled: true,
    validationRulesEnabled: true,
    duplicateDetectionEnabled: true,
    overdueThresholdHours: 48,
    stalledThresholdHours: 24,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    classificationRules: [
      {
        ruleId: "billing",
        label: "Billing issues",
        category: "billing",
        keywords: ["bill", "payment", "invoice", "refund", "charge"],
        enabled: true,
      },
      {
        ruleId: "account",
        label: "Account issues",
        category: "account",
        keywords: ["account", "login", "password", "access"],
        enabled: true,
      },
      {
        ruleId: "shipping",
        label: "Shipping issues",
        category: "shipping",
        keywords: ["ship", "delivery", "order", "tracking"],
        enabled: true,
      },
      {
        ruleId: "technical",
        label: "Technical issues",
        category: "technical",
        keywords: ["error", "bug", "broken", "crash", "technical"],
        enabled: true,
      },
      {
        ruleId: "escalation",
        label: "Escalation",
        category: "escalation",
        keywords: ["urgent", "manager", "escalate", "complaint"],
        enabled: true,
      },
    ],
    priorityRules: [
      {
        ruleId: "critical_escalation",
        label: "Critical escalation priority",
        priority: "critical",
        categories: ["escalation"],
        enabled: true,
      },
      {
        ruleId: "high_billing",
        label: "High billing priority",
        priority: "high",
        categories: ["billing", "account"],
        enabled: true,
      },
      {
        ruleId: "medium_general",
        label: "Medium general priority",
        priority: "medium",
        categories: ["technical", "shipping", "general"],
        enabled: true,
      },
    ],
    assignmentRules: [
      {
        ruleId: "default_support",
        label: "Default support team",
        defaultOwner: "support-team",
        categories: ["general", "technical"],
        maxTicketsPerOwner: 50,
        enabled: true,
      },
      {
        ruleId: "billing_team",
        label: "Billing team",
        defaultOwner: "billing-team",
        categories: ["billing"],
        maxTicketsPerOwner: 30,
        enabled: true,
      },
      {
        ruleId: "escalation_team",
        label: "Escalation team",
        defaultOwner: "escalation-team",
        categories: ["escalation"],
        maxTicketsPerOwner: 20,
        enabled: true,
      },
    ],
    escalationRules: [
      {
        ruleId: "critical_escalation",
        label: "Auto-escalate critical tickets",
        escalatePriorities: ["critical"],
        enabled: true,
      },
    ],
    maskSensitiveValues: true,
  };

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadTicketManagementEngineConfigFile(
  repositoryRoot: string,
): Partial<TicketManagementEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ticket-management-engine.config.json"),
    join(repositoryRoot, "config", "ticket-management-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<TicketManagementEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildTicketManagementEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TicketManagementEngineConfiguration> = {},
): TicketManagementEngineConfiguration {
  const fileConfig = repositoryRoot ? loadTicketManagementEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<TicketManagementEngineConfiguration> = {
    enabled: envBool(
      "TICKET_MANAGEMENT_ENGINE_ENABLED",
      DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "TICKET_MANAGEMENT_ENGINE_TIMEOUT_MS",
      DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "TICKET_MANAGEMENT_ENGINE_MAX_RETRIES",
      DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    overdueThresholdHours: envInt(
      "TICKET_MANAGEMENT_ENGINE_OVERDUE_HOURS",
      DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION.overdueThresholdHours,
    ),
    stalledThresholdHours: envInt(
      "TICKET_MANAGEMENT_ENGINE_STALLED_HOURS",
      DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION.stalledThresholdHours,
    ),
    loggingLevel: envString(
      "TICKET_MANAGEMENT_ENGINE_LOG_LEVEL",
      DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION.loggingLevel,
    ) as TicketManagementEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "TICKET_MANAGEMENT_ENGINE_AUTO_RECOVER",
      DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_TICKET_MANAGEMENT_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
