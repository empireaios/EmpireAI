import { z } from "zod";

export const ESIS_HEALTH_STATES = ["HEALTHY", "WARNING", "FAILED", "UNKNOWN"] as const;
export type EsisHealthState = (typeof ESIS_HEALTH_STATES)[number];

export const esisHealthScoreSchema = z.object({
  state: z.enum(ESIS_HEALTH_STATES),
  score: z.number().min(0).max(100),
  summary: z.string(),
});

export const esisFrontendPageSchema = z.object({
  route: z.string(),
  pageComponent: z.string(),
  title: z.string(),
  purpose: z.string(),
  navigationSection: z.string(),
  primaryActions: z.array(z.string()),
  uiElements: z.object({
    buttons: z.number().int().min(0),
    cards: z.number().int().min(0),
    metrics: z.number().int().min(0),
    tables: z.number().int().min(0),
    forms: z.number().int().min(0),
    dialogs: z.number().int().min(0),
    widgets: z.number().int().min(0),
    hasLoadingState: z.boolean(),
    hasEmptyState: z.boolean(),
    hasErrorState: z.boolean(),
  }),
  boundApis: z.array(z.string()),
  layoutHierarchy: z.array(z.string()),
  commercialObjective: z.string(),
  missingImplementation: z.array(z.string()),
  futureHooks: z.array(z.string()),
});

export const esisBackendModuleSchema = z.object({
  moduleId: z.string(),
  category: z.string(),
  purpose: z.string(),
  dependencies: z.array(z.string()),
  services: z.array(z.string()),
  repositories: z.array(z.string()),
  routes: z.array(z.string()),
  brainTools: z.array(z.string()),
  databaseTables: z.array(z.string()),
  validationSuites: z.array(z.string()),
  health: z.enum(ESIS_HEALTH_STATES),
  missingIntegrations: z.array(z.string()),
  placeholders: z.array(z.string()),
});

export const esisCommerceStageSchema = z.object({
  stage: z.string(),
  module: z.string(),
  status: z.string(),
  blockers: z.array(z.string()),
  canonPhase: z.string().optional(),
});

export const esisConnectorReportSchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  connection: z.string(),
  health: z.string(),
  oauth: z.string(),
  scopes: z.array(z.string()),
  token: z.string(),
  permissions: z.array(z.string()),
  publishCapability: z.boolean(),
  webhookCapability: z.boolean(),
  retryCapability: z.boolean(),
  executionStatus: z.string(),
  blocked: z.boolean(),
  blockedReason: z.string().optional(),
});

export const esisProductionReportSchema = z.object({
  typecheck: z.object({ status: z.string(), detail: z.string().optional() }),
  tests: z.object({
    status: z.string(),
    passed: z.number().int().min(0).optional(),
    failed: z.number().int().min(0).optional(),
    total: z.number().int().min(0).optional(),
    detail: z.string().optional(),
  }),
  coverage: z.object({ status: z.string(), detail: z.string().optional() }),
  build: z.object({ status: z.string(), detail: z.string().optional() }),
  productionBlockers: z.array(z.string()),
  securityBlockers: z.array(z.string()),
  commercialBlockers: z.array(z.string()),
  firstDollarBlockers: z.array(z.string()),
  technicalDebt: z.array(z.string()),
});

export const esisVisualMapsSchema = z.object({
  navigationTree: z.record(z.unknown()),
  frontendPageGraph: z.array(z.object({ route: z.string(), component: z.string(), apis: z.array(z.string()) })),
  backendModuleGraph: z.array(z.object({ module: z.string(), category: z.string(), routes: z.array(z.string()) })),
  commerceLifecycleGraph: z.array(z.object({ stage: z.string(), module: z.string(), status: z.string() })),
  connectorGraph: z.array(z.object({ providerId: z.string(), health: z.string(), blocked: z.boolean() })),
  apiDependencyGraph: z.array(z.object({ route: z.string(), module: z.string() })),
  dashboardGraph: z.array(z.object({ dashboard: z.string(), sourceModule: z.string() })),
});

export const esisInspectionReportSchema = z.object({
  reportId: z.string(),
  generatedAt: z.string().datetime({ offset: true }),
  workspaceId: z.string(),
  companyId: z.string(),
  deterministicHash: z.string(),
  executiveSummary: z.string(),
  frontend: z.object({
    summary: z.string(),
    pages: z.array(esisFrontendPageSchema),
    unroutedPages: z.array(z.string()),
    routeCount: z.number().int(),
  }),
  backend: z.object({
    summary: z.string(),
    modules: z.array(esisBackendModuleSchema),
    routeCount: z.number().int(),
    toolCount: z.number().int(),
    tableCount: z.number().int(),
  }),
  commerce: z.object({
    summary: z.string(),
    stages: z.array(esisCommerceStageSchema),
    canonCompliance: z.string(),
    stateMachineCompliance: z.string(),
  }),
  connectors: z.object({
    summary: z.string(),
    entries: z.array(esisConnectorReportSchema),
  }),
  production: esisProductionReportSchema,
  visualMaps: esisVisualMapsSchema,
  risks: z.array(z.string()),
  recommendedNextPriority: z.string(),
  constitution: z.object({
    summary: z.string(),
    coveragePercent: z.number(),
    compliantCount: z.number(),
    partialCount: z.number(),
    violationCount: z.number(),
    articleCount: z.number(),
    violations: z.array(z.string()),
  }),
  governance: z.object({
    summary: z.string(),
    coveragePercent: z.number(),
    compliantCount: z.number(),
    partialCount: z.number(),
    violationCount: z.number(),
    doctrineCount: z.number(),
    authorityMatrixCount: z.number(),
    reviewPassed: z.boolean(),
    violations: z.array(z.string()),
  }),
  architecture: z.object({
    summary: z.string(),
    coveragePercent: z.number(),
    compliantCount: z.number(),
    partialCount: z.number(),
    violationCount: z.number(),
    constraintCount: z.number(),
    dependencyReviewCount: z.number(),
    reviewPassed: z.boolean(),
    violations: z.array(z.string()),
    dependencyReview: z.array(
      z.object({
        edgeId: z.string(),
        fromModule: z.string(),
        toModule: z.string(),
        relationship: z.string(),
        status: z.enum(["EXPLICIT", "ADAPTER", "COMPLIANT", "VIOLATION"]),
        acdArticle: z.string(),
        note: z.string(),
      }),
    ),
  }),
  uxIdentity: z.object({
    summary: z.string(),
    coveragePercent: z.number(),
    compliantCount: z.number(),
    partialCount: z.number(),
    violationCount: z.number(),
    doctrineCount: z.number(),
    identityCoverageCount: z.number(),
    uxCoverageCount: z.number(),
    navigationReviewCount: z.number(),
    reviewPassed: z.boolean(),
    violations: z.array(z.string()),
    navigationReview: z.array(
      z.object({
        routeId: z.string(),
        path: z.string(),
        label: z.string(),
        role: z.string(),
        purpose: z.string(),
        uidArticles: z.array(z.string()),
        status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
      }),
    ),
  }),
  commercial: z.object({
    summary: z.string(),
    coveragePercent: z.number(),
    compliantCount: z.number(),
    partialCount: z.number(),
    violationCount: z.number(),
    doctrineCount: z.number(),
    businessRuleCount: z.number(),
    integrityReviewCount: z.number(),
    reviewPassed: z.boolean(),
    violations: z.array(z.string()),
    businessRuleCoverage: z.array(z.string()),
    commercialIntegrityReview: z.array(
      z.object({
        ruleId: z.string(),
        domain: z.string(),
        rule: z.string(),
        status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
        cbdArticle: z.string(),
        evidence: z.string(),
      }),
    ),
  }),
});

export const esisDashboardSchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  reviewTimestamp: z.string().datetime({ offset: true }).nullable(),
  systemHealth: esisHealthScoreSchema,
  architectureHealth: esisHealthScoreSchema,
  commerceHealth: esisHealthScoreSchema,
  frontendHealth: esisHealthScoreSchema,
  backendHealth: esisHealthScoreSchema,
  validationHealth: esisHealthScoreSchema,
  productionReadiness: esisHealthScoreSchema,
  lastReportPath: z.string().optional(),
  summary: z.string(),
});

export type EsisInspectionReport = z.infer<typeof esisInspectionReportSchema>;
export type EsisDashboard = z.infer<typeof esisDashboardSchema>;
export type EsisFrontendPage = z.infer<typeof esisFrontendPageSchema>;
export type EsisBackendModule = z.infer<typeof esisBackendModuleSchema>;
export type EsisConnectorReport = z.infer<typeof esisConnectorReportSchema>;
export type EsisProductionReport = z.infer<typeof esisProductionReportSchema>;
export type EsisCommerceStage = z.infer<typeof esisCommerceStageSchema>;
export type EsisVisualMaps = z.infer<typeof esisVisualMapsSchema>;
