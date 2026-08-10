export type EnginePanelHealth =
  | "HEALTHY"
  | "WARNING"
  | "FAILED"
  | "NOT_IMPLEMENTED"
  | "UNKNOWN";

export type EnginePanelView = {
  engineId: string;
  displayName: string;
  computedAt: string;
  dataMode: "live" | "sandbox" | "demo";
  implemented: boolean;
  currentState: string;
  health: EnginePanelHealth;
  progress: { percent: number; label: string };
  nextAction: string;
  executiveAudit: { summary: string; artifactRef: string | null };
  dependencies: string[];
  metrics?: Array<{ label: string; value: string }>;
  detailRows?: Array<{ label: string; value: string; status?: string }>;
};

export type ExecutiveWidgetDataMode = "live" | "sandbox" | "unavailable";

export type ExecutiveSummaryCard = {
  id: string;
  widgetId: string;
  title: string;
  available: boolean;
  liveDataAvailable: boolean;
  dataMode: ExecutiveWidgetDataMode;
  dataSource: string;
  refreshSeconds: number;
  futureEnhancement: string;
  primaryValue: string | null;
  status: string;
  dependency: string | null;
  nextAction: string;
  href: string | null;
  health: string | null;
  items: Array<{ label: string; value: string; timestamp?: string }>;
  engineCenterId?: string | null;
};

export type ExecutiveAttentionItem = {
  id: string;
  label: string;
  severity: "critical" | "warning" | "info";
  href: string | null;
  engineId?: string | null;
};

export type ExecutiveTimelineEvent = {
  id: string;
  sourceEngine: string;
  sourceLabel: string;
  title: string;
  summary: string;
  timestamp: string;
  href: string;
};

export type ExecutiveAlert = {
  id: string;
  label: string;
  severity: "critical" | "warning" | "info";
  engineId: string | null;
  href: string;
};

export type ExecutiveApprovalRoute = {
  id: string;
  title: string;
  summary: string;
  type: string;
  workflowHref: string;
  engineId: string | null;
};

export type ExecutiveDependencyGraph = {
  nodes: Array<{ engineId: string; displayName: string; route: string; health: string }>;
  edges: Array<{ from: string; to: string; label: string }>;
};

export type ExecutiveHomeBrief = {
  overallEmpireStatus: string;
  currentStrategicObjective: string;
  currentConstitutionalPhase: string;
  currentExecutionPhase: string;
  highestPriorityRisk: string;
  highestPriorityOpportunity: string;
  currentRecommendation: string;
};

export type MissionCentreSummary = {
  currentMission: string;
  missionOwner: string;
  currentStep: string;
  progress: number;
  eta: string;
  dependencies: string[];
  currentRisks: string[];
  validationStatus: string;
  recoveryStatus: string;
  href: string;
};

export type PillowCentreSummary = {
  recommendations: string[];
  architectureFindings: string[];
  engineeringFindings: string[];
  businessFindings: string[];
  commercialOpportunities: string[];
  visionAlignment: string;
  pendingDecisions: string[];
};

export type BusinessCentreSummary = {
  activeBusinesses: number;
  revenue: string;
  orders: string;
  profit: string;
  advertisingSpend: string;
  marketingPerformance: string;
  businessHealth: string;
  growthTrend: string;
  href: string;
};

export type ProductionCentreSummary = {
  productionHealth: string;
  runtimeHealth: string;
  guardianStatus: string;
  sessions: string;
  infrastructure: string;
  deploymentStatus: string;
  currentIncidents: string[];
  href: string;
};

export type ExecutiveHomeCentreSummaries = {
  mission: MissionCentreSummary;
  pillow: PillowCentreSummary;
  business: BusinessCentreSummary;
  production: ProductionCentreSummary;
};

export type RelationshipNodeKind =
  | "engine"
  | "company"
  | "brand"
  | "product"
  | "marketplace"
  | "supplier";

export type RelationshipEdgeKind =
  | "depends_on"
  | "feeds"
  | "upstream"
  | "downstream"
  | "active_mission"
  | "blocking_issue";

export type RelationshipGraphNode = {
  id: string;
  kind: RelationshipNodeKind;
  label: string;
  route: string | null;
  engineId: string | null;
  department: string;
  health: string;
  currentState: string | null;
  dependencies: string[];
  upstream: Array<{ engineId: string; label: string; route: string; edgeLabel: string }>;
  downstream: Array<{ engineId: string; label: string; route: string; edgeLabel: string }>;
  activeMissions: Array<{ id: string; title: string; progress: number; status: string; href: string }>;
  blockingIssues: Array<{ id: string; label: string; severity: string; href: string }>;
};

export type RelationshipGraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: RelationshipEdgeKind;
  label: string;
};

export type ExecutiveRelationshipGraphView = {
  computedAt: string;
  schemaVersion: "g4-08-v1";
  nodes: RelationshipGraphNode[];
  edges: RelationshipGraphEdge[];
  summary: {
    totalEngines: number;
    healthyEngines: number;
    enginesWithBlockers: number;
    activeMissionLinks: number;
    dependencyEdges: number;
  };
  futureExpansion: {
    nodeKinds: RelationshipNodeKind[];
    edgeKinds: RelationshipEdgeKind[];
    registrationPattern: string;
    notes: string[];
  };
};

export type ExecutiveHomeView = {
  computedAt: string;
  greeting: {
    displayNameHint: string;
    topBlocker: string | null;
    topBlockerHref: string | null;
  };
  command: {
    certificationBlockers: Record<
      string,
      { id: string; label: string; status: string; detail: string }
    >;
    operationalReadiness: { percent: number; passed: boolean; detail: string };
    proof001: {
      achieved: boolean;
      progressPercent: number;
      stagesPassed: number;
      totalStages: number;
      detail: string;
    };
    oms: {
      activeObjective: string;
      progress: number;
      overallHealth: string;
      nextHighestImpactAction: string | null;
    };
    pendingApprovals: { count: number };
    success001: { currentNetProfitUsd: number; progressPercent: number };
  };
  portfolio: {
    portfolioMetrics: Array<{ label: string; value: string; change?: string }>;
    companies: Array<{ id: string; name: string; status: string; revenue: string }>;
    recentActivity: Array<{ id: string; agent: string; action: string; timestamp: string }>;
  };
  engineSummaries: Array<{
    engineId: string;
    displayName: string;
    health: EnginePanelHealth;
    progress: { percent: number; label: string };
  }>;
  summaryCards: ExecutiveSummaryCard[];
  attentionItems: ExecutiveAttentionItem[];
  nextExecutiveAction: string;
  executiveTimeline: ExecutiveTimelineEvent[];
  executiveAlerts: ExecutiveAlert[];
  approvalRoutes: ExecutiveApprovalRoute[];
  dependencyGraph: ExecutiveDependencyGraph;
  architectureVersion: "P7-04";
  executiveBrief: ExecutiveHomeBrief;
  centreSummaries: ExecutiveHomeCentreSummaries;
  canonicalTruth?: CanonicalExecutiveTruth;
};

export type CanonicalExecutiveTruth = {
  computedAt: string;
  systemOperational: boolean;
  brainStatus: "online" | "degraded" | "unknown";
  guardianStatus: string;
  productionStatus: string;
  commerceReadiness: string;
  realisedRevenueUsd: number | null;
  realisedOrders: number | null;
  realisedProfitUsd: number | null;
  portfolioCompaniesTotal: number;
  livePortfolioCompanies: number;
  seedPortfolioExcludedFromLiveEconomics: true;
  activeMissionTitle: string | null;
  activeMissionHuman: string;
  openMissionCount: number;
  pendingApprovals: number;
  pendingApprovalTitles: string[];
  currentObjectiveHuman: string;
  currentBlockers: Array<{ humanLabel: string; engineeringId?: string; current: boolean }>;
  commerceOpportunity: {
    opportunityId: string;
    asin: string;
    cjPid: string;
    amazonSellerSku: string;
    productName: string;
    expectedProfitUsd: string;
    expectedMarginPct: string;
    offerPrice: string;
    disposition: string;
    approvalId: string | null;
    approvalStatus: string;
    summary: string;
    dossierSummary?: string | null;
    brandRoute?: string | null;
    pillowRecommendation?: string | null;
    competingOffers?: string | null;
    deliveryPromise?: string | null;
    listingRoute?: string | null;
    lowestCompetitorPriceUsd?: number | null;
    featuredOfferPriceUsd?: number | null;
    supplierCostUsd?: number | null;
    shippingUsd?: number | null;
    demandEvidence?: string | null;
    catalogImageUrl?: string | null;
  } | null;
  pillowActivity: {
    institutionalMemoryLessons: number;
    institutionalMemoryCertified: boolean;
    pendingCommerceRecommendation: boolean;
    nextAutonomousAction: string;
  };
  grandKingAttention: Array<{
    id: string;
    priority:
      | "critical_system"
      | "money_approval"
      | "commercial_opportunity"
      | "important_decision"
      | "informational";
    title: string;
    detail: string;
    href: string | null;
    engineeringId?: string;
  }>;
  nextGrandKingAction: string;
  nextPillowAction: string;
  dataIntegrityNotes: string[];
  pillowOperatingState?: {
    state: string;
    humanLabel: string;
    currentFocus: string;
    lastHeartbeatAt: string | null;
    lastOperatingCycleAt: string | null;
    nextScheduledCycleAt: string | null;
    needsGrandKing: boolean;
    needsGrandKingReason: string | null;
    costGuardLevel: string;
    birthStatus: string;
    activityMode?: string;
    winningPurpose?: string;
    winningOperatingQuestion?: string;
  } | null;
  sinceLastVisit?: {
    lastVisitAt: string | null;
    discovered: number;
    analysed: number;
    rejected: number;
    approvalsRequested: number;
    purchasesMade: number;
    aiApiCostIncurredUsd: number;
    latestMeaningfulActions: Array<{ at: string; type: string; summary: string }>;
    nextWork: string | null;
    needsGrandKing: boolean;
    needsGrandKingReason: string | null;
  } | null;
  costGuard?: {
    level: string;
    hardStopActive: boolean;
    unconfiguredLimitKeys: string[];
    actualUsd: number;
    committedUsd: number;
    forecastUsd: number;
  } | null;
  birth?: {
    status: string;
    birthTimestamp: string | null;
    technicallyReady: boolean;
    operatingAgeSeconds: number | null;
    gatesPassedCount: number;
    gatesTotal: number;
  } | null;
  oneProductCommissioning?: {
    productName: string;
    supplier: string;
    marketplace: string;
    expectedProfit: string;
    pillowRecommendation: string;
    stage: string;
    buyable: false | "UNKNOWN";
    grandKingDecision: string;
    selectionAuthority: "pillow";
    cursorSelected: false;
    visualRoute: string;
  } | null;
  smartViableKpi?: {
    smartViable: number;
    target: number;
    distanceToTarget: number;
    evaluated: number;
    rejected: number;
    topRejectionReasons?: Array<{
      reasonCode: string;
      count: number;
      humanLabel: string;
    }>;
  } | null;
  flightRecorderLatest?: Array<{ at: string; type: string; summary: string }>;
};

export type MissionCentreView = {
  computedAt: string;
  oms: {
    activeObjective: string;
    progress: number;
    confidence: number;
    currentBlocker: string | null;
    nextHighestImpactAction: string | null;
    overallHealth: string;
  };
  blockers: Array<{ id: string; label: string; detail: string; status: string }>;
  pendingApprovals: Array<{
    approvalId: string;
    title: string;
    summary: string;
    type: string;
    status: string;
  }>;
  missions: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    priority: string;
  }>;
};

export type ExecutiveAuditView = {
  computedAt: string;
  certificationBlockers: Record<
    string,
    { id: string; label: string; status: string; detail: string }
  >;
  b6: {
    progressPercent: number;
    currentObjectiveId: string;
    nextHighestImpactAction: string;
    items: Array<{ id: string; label: string; status: string; detail: string }>;
  };
  infrastructure: { b5Closed: boolean; blockers: string[] };
  activation: { ready: boolean; blockers: string[] };
  esis: {
    systemHealth: { state: string; score: number; summary: string };
    commerceHealth: { state: string; score: number; summary: string };
    productionHealth: { state: string; score: number; summary: string };
  };
};

export type PillowSupervisorView = {
  computedAt: string;
  deliveryMode: string;
  productionModeEnabled: boolean;
  pendingApprovals: number;
  recentApprovals: Array<{
    approvalId: string;
    title: string;
    status: string;
    type: string;
  }>;
  capabilityNote: string;
};

export type CockpitEngineId =
  | "supplier"
  | "marketplace"
  | "storefront"
  | "advertising"
  | "payment"
  | "logistics"
  | "analytics"
  | "quantitative-intelligence"
  | "pillow-supervisor";

export type EngineCenterSection = {
  available: boolean;
  status: string;
  dependency: string | null;
  nextAction: string;
  headline?: string | null;
  items?: Array<{ label: string; value: string; status?: string; timestamp?: string }>;
  metrics?: Array<{ label: string; value: string }>;
  artifactRef?: string | null;
};

export type EngineCenterView = EnginePanelView & {
  route: string;
  aiInsight: import("@/lib/cockpit/interaction/types").AiInsightContract;
  sections: {
    overview: EngineCenterSection;
    health: EngineCenterSection;
    currentActivity: EngineCenterSection;
    dependencies: EngineCenterSection;
    executiveAudit: EngineCenterSection;
    configuration: EngineCenterSection;
    futureExpansion: EngineCenterSection;
    nextActions: EngineCenterSection;
  };
  siblingEngines: Array<{ engineId: string; displayName: string; route: string }>;
  crossEngine: {
    upstream: Array<{ engineId: string; displayName: string; route: string; reason: string }>;
    downstream: Array<{ engineId: string; displayName: string; route: string; reason: string }>;
    relatedEngines: Array<{ engineId: string; displayName: string; route: string; health: string }>;
    relatedMissions: Array<{ id: string; title: string; progress: number; status: string; href: string }>;
  };
};

export type AutomationCentreView = {
  computedAt: string;
  workspaceId: string;
  screenId: "SCR-303";
  dataMode: "live" | "sandbox";
  overview: {
    health: string;
    runningCount: number;
    queuedCount: number;
    scheduledCount: number;
    completedCount: number;
    failedCount: number;
    recoveringCount: number;
    approvalPendingCount: number;
  };
  kpis: Array<{ id: string; label: string; value: string; trend: "up" | "down" | "neutral"; status: string }>;
  attentionItems: Array<{ id: string; label: string; severity: string; href: string | null; automationId?: string }>;
  runningWorkflows: Array<{
    automationId: string;
    workflowId: string;
    triggerId: string;
    currentState: string;
    correlationId: string;
    updatedAt: string;
  }>;
  queuedWorkflows: AutomationCentreView["runningWorkflows"];
  scheduledWorkflows: AutomationCentreView["runningWorkflows"];
  completedWorkflows: AutomationCentreView["runningWorkflows"];
  failedWorkflows: AutomationCentreView["runningWorkflows"];
  approvalQueue: Array<{
    approvalId: string;
    workflowId: string;
    triggerId: string;
    approvalTier: string;
    approvalState: string;
    summary: string;
    requestedAt: string;
    expiryAt?: string;
    correlationId: string;
  }>;
  recoveryOperations: Array<{
    recoveryId: string;
    executionId: string;
    recoveryState: string;
    failureCategory: string;
    failureCause: string;
  }>;
  schedulerSummary: { dueCount: number; retryingCount: number; recoveredCount: number };
  registryHealth: Array<{ registryId: string; registryType: string; name: string; status: string; detail: string }>;
  recentActivity: Array<{
    eventId: string;
    kind: string;
    title: string;
    summary: string;
    timestamp: string;
    automationId?: string;
    correlationId?: string;
  }>;
  notifications: Array<{ notificationRegistryId: string; channel: string; templateRef: string; status: string }>;
  relationshipLinks: Array<{ label: string; href: string; module: string }>;
  pluginWidgets: Array<{ pluginId: string; title: string; summary: string }>;
  installedPlugins: Array<{
    pluginId: string;
    pluginName: string;
    version: string;
    category: string;
    lifecycleState: string;
    healthStatus: string;
    capabilities: string[];
    lastActivityAt?: string;
  }>;
};

export type AutomationDetailView = {
  computedAt: string;
  automationId: string;
  executionId?: string;
  queueId?: string;
  workflowId: string;
  workflowVersion?: string;
  triggerId: string;
  currentState: string;
  approvalStatus: string;
  decisionSource?: string;
  correlationId: string;
  registryReferences: Record<string, unknown>;
  businessEngines: Array<{ stepId: string; executorType: string; executorRef: string }>;
  recoveryStatus?: {
    recoveryState: string;
    failureCategory?: string;
    failureCause?: string;
    rollbackId?: string;
  };
  supportingEvidence?: Record<string, unknown>;
  eklsLearning: {
    lessonsLearnedHref: string | null;
    historicalOutcomes: Array<{ label: string; timestamp: string }>;
    similarAutomations: string[];
    decisionHistory: Array<{ label: string; timestamp: string }>;
    learningId?: string;
    lessonsLearned?: string[];
    outcomeSummary?: string;
  };
  timeline: Array<{ phase: string; label: string; state: string; timestamp?: string; detail?: string }>;
  availableActions: Array<{ action: string; label: string; pillowGoverned: true; enabled: boolean }>;
};

export type AutomationTimelineView = {
  computedAt: string;
  automationId: string;
  executionId?: string;
  phases: string[];
  events: AutomationDetailView["timeline"];
};

export type AuthorizationProviderCard = {
  providerId: string;
  providerName: string;
  providerCategory: string;
  connectionStatus: string;
  authorizationStatus: string;
  credentialStatus: string;
  healthStatus: string;
  readinessStatus: string;
  expiry: string | null;
  requiredAction: string | null;
  accountHolderId: string;
  accountHolderType: string;
  environment: string;
  lastVerified: string | null;
  primaryAction: "connect" | "reconnect" | "review" | "none";
};

export type AuthorizationCentreView = {
  computedAt: string;
  workspaceId: string;
  screenId: "SCR-304";
  route: string;
  dataMode: string;
  overview: {
    overallReadinessPercent: number;
    connectedProviders: number;
    disconnectedProviders: number;
    expiredAuthorizations: number;
    missingCredentials: number;
    missingPermissions: number;
    reconnectRequired: number;
  };
  providerCards: AuthorizationProviderCard[];
  providerMatrix: Array<{
    providerId: string;
    displayName: string;
    status: string;
    severity: string;
    checkCount: number;
    lastCheckedAt: string | null;
  }>;
  attentionItems: Array<{
    attentionId: string;
    providerId: string;
    status: string;
    severity: string;
    message: string;
    requiredAction: string | null;
  }>;
  accountHolderGroups: Array<{
    accountHolderTypeId: string;
    accountHolderTypeName: string;
    connectionCount: number;
    providerIds: string[];
  }>;
  grandKingConnections: string[];
  futureCustomerConnections: string[];
  recentActivity: Array<{
    activityId: string;
    kind: string;
    providerId?: string;
    summary: string;
    recordedAt: string;
  }>;
  eklsReferenceCount: number;
  pillowGovernanceState: string;
  pluginWidgets: Array<{ pluginId: string; title: string; summary: string }>;
  brainModule: string;
};

export type AuthorizationCentreDetailView = {
  computedAt: string;
  workspaceId: string;
  providerId: string;
  providerName: string;
  connectionSummary: {
    connectionId: string;
    connectionStatus: string;
    authorizationStatus: string;
    credentialStatus: string;
    healthStatus: string;
    readinessStatus: string;
    environment: string;
    accountHolderId: string;
    expiry: string | null;
    lastVerified: string | null;
  };
  requiredScopes: string[];
  grantedScopes: string[];
  missingScopes: string[];
  requiredPermissions: string[];
  grantedPermissions: string[];
  missingPermissions: string[];
  credentialReferences: Array<{
    credentialRefId: string;
    credentialType: string;
    status: string;
    vaultBackend: string;
    expiresAt: string | null;
    lastVerifiedAt: string | null;
  }>;
  healthChecks: Array<{
    healthCheckId: string;
    checkType: string;
    status: string;
    severity: string;
    message: string;
    lastCheckedAt: string;
  }>;
  readinessResult: { readinessPercent: number; overallStatus: string };
  eklsEvents: Array<{
    referenceId: string;
    kind: string;
    summary: string;
    recordedAt: string;
    channel: string;
  }>;
  brainActions: string[];
  pillowGovernanceState: string;
  governanceChecks: {
    workspaceOwnership: boolean;
    providerEligibility: boolean;
    monitoringPermission: boolean;
    credentialVisibilityBoundary: boolean;
  };
};
