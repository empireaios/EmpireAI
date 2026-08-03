/** X3-14 — Externalized Global Scaling Planner configuration. */



import { readFileSync, existsSync } from "node:fs";

import { join } from "node:path";



export type GlobalScalingPlannerConfiguration = {

  enabled: boolean;

  planningRulesEnabled: boolean;

  internationalExpansionReadinessEnabled: boolean;

  targetRegionIdentificationEnabled: boolean;

  targetCountryIdentificationEnabled: boolean;

  regionalDemandEvaluationEnabled: boolean;

  regionalOperationalReadinessEnabled: boolean;

  supplierReadinessByRegionEnabled: boolean;

  financialReadinessForExpansionEnabled: boolean;

  opportunityRankingEnabled: boolean;

  recommendationRulesEnabled: boolean;

  validationRulesEnabled: boolean;

  healthMonitoringRulesEnabled: boolean;

  neverExposeCredentials: true;

  neverExposeAuthenticationTokens: true;

  neverRecommendInternationalExpansionWithoutValidatedReadiness: true;

  preservePlanningTraceability: true;

  preserveAuditability: true;

  preserveEnterpriseIntegrity: true;

  structuralSignalsOnly: true;

  maskSensitiveValues: true;

  neverLogSensitiveOperationalInformation: true;

  expansionReadinessThreshold: number;

  highPriorityThreshold: number;

  criticalPriorityThreshold: number;

  regionalOpportunityThreshold: number;

  regionalDemandThreshold: number;

  regionalOperationalThreshold: number;

  supplierReadinessThreshold: number;

  financialReadinessThreshold: number;

  connectionTimeoutMs: number;

  maxRetryAttempts: number;

  retryDelayMs: number;

  retryBackoffMultiplier: number;

  loggingLevel: "debug" | "info" | "warn" | "error";

  autoRecover: boolean;

};



export const DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION: GlobalScalingPlannerConfiguration = {

  enabled: true,

  planningRulesEnabled: true,

  internationalExpansionReadinessEnabled: true,

  targetRegionIdentificationEnabled: true,

  targetCountryIdentificationEnabled: true,

  regionalDemandEvaluationEnabled: true,

  regionalOperationalReadinessEnabled: true,

  supplierReadinessByRegionEnabled: true,

  financialReadinessForExpansionEnabled: true,

  opportunityRankingEnabled: true,

  recommendationRulesEnabled: true,

  validationRulesEnabled: true,

  healthMonitoringRulesEnabled: true,

  neverExposeCredentials: true,

  neverExposeAuthenticationTokens: true,

  neverRecommendInternationalExpansionWithoutValidatedReadiness: true,

  preservePlanningTraceability: true,

  preserveAuditability: true,

  preserveEnterpriseIntegrity: true,

  structuralSignalsOnly: true,

  maskSensitiveValues: true,

  neverLogSensitiveOperationalInformation: true,

  expansionReadinessThreshold: 55,

  highPriorityThreshold: 70,

  criticalPriorityThreshold: 85,

  regionalOpportunityThreshold: 60,

  regionalDemandThreshold: 60,

  regionalOperationalThreshold: 60,

  supplierReadinessThreshold: 60,

  financialReadinessThreshold: 60,

  connectionTimeoutMs: 30000,

  maxRetryAttempts: 3,

  retryDelayMs: 500,

  retryBackoffMultiplier: 2,

  loggingLevel: "info",

  autoRecover: true,

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



export function loadGlobalScalingPlannerConfigFile(

  repositoryRoot: string,

): Partial<GlobalScalingPlannerConfiguration> | null {

  const candidates = [

    join(repositoryRoot, "global-scaling-planner.config.json"),

    join(repositoryRoot, "config", "global-scaling-planner.config.json"),

  ];

  for (const path of candidates) {

    if (!existsSync(path)) continue;

    try {

      return JSON.parse(readFileSync(path, "utf8")) as Partial<GlobalScalingPlannerConfiguration>;

    } catch {

      return null;

    }

  }

  return null;

}



export function buildGlobalScalingPlannerConfiguration(

  repositoryRoot?: string,

  overrides: Partial<GlobalScalingPlannerConfiguration> = {},

): GlobalScalingPlannerConfiguration {

  const fileConfig = repositoryRoot

    ? loadGlobalScalingPlannerConfigFile(repositoryRoot)

    : null;

  const envConfig: Partial<GlobalScalingPlannerConfiguration> = {

    enabled: envBool(

      "GLOBAL_SCALING_PLANNER_ENABLED",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.enabled,

    ),

    connectionTimeoutMs: envInt(

      "GLOBAL_SCALING_PLANNER_TIMEOUT_MS",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.connectionTimeoutMs,

    ),

    maxRetryAttempts: envInt(

      "GLOBAL_SCALING_PLANNER_MAX_RETRIES",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.maxRetryAttempts,

    ),

    expansionReadinessThreshold: envInt(

      "GLOBAL_SCALING_PLANNER_READINESS_THRESHOLD",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.expansionReadinessThreshold,

    ),

    highPriorityThreshold: envInt(

      "GLOBAL_SCALING_PLANNER_HIGH_PRIORITY",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.highPriorityThreshold,

    ),

    criticalPriorityThreshold: envInt(

      "GLOBAL_SCALING_PLANNER_CRITICAL_PRIORITY",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.criticalPriorityThreshold,

    ),

    regionalOpportunityThreshold: envInt(

      "GLOBAL_SCALING_PLANNER_OPPORTUNITY_THRESHOLD",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.regionalOpportunityThreshold,

    ),

    loggingLevel: envString(

      "GLOBAL_SCALING_PLANNER_LOG_LEVEL",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.loggingLevel,

    ) as GlobalScalingPlannerConfiguration["loggingLevel"],

    autoRecover: envBool(

      "GLOBAL_SCALING_PLANNER_AUTO_RECOVER",

      DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION.autoRecover,

    ),

  };



  return {

    ...DEFAULT_GLOBAL_SCALING_PLANNER_CONFIGURATION,

    ...fileConfig,

    ...envConfig,

    ...overrides,

    neverExposeCredentials: true,

    neverExposeAuthenticationTokens: true,

    neverRecommendInternationalExpansionWithoutValidatedReadiness: true,

    preservePlanningTraceability: true,

    preserveAuditability: true,

    preserveEnterpriseIntegrity: true,

    structuralSignalsOnly: true,

    maskSensitiveValues: true,

    neverLogSensitiveOperationalInformation: true,

  };

}


