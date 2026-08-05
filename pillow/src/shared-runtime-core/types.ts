import type { SharedRuntimeCoreConfiguration } from "./configuration.js";
import type {
  AUDIT_STATUSES,
  DEPENDENCY_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  ROUTING_STATUSES,
  RUNTIME_SERVICES,
  SRTC_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type RoutingStatus = (typeof ROUTING_STATUSES)[number];
export type DependencyStatusValue = (typeof DEPENDENCY_STATUSES)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type RuntimeServiceName = (typeof RUNTIME_SERVICES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type SharedRuntimeCoreCapability = (typeof SRTC_CAPABILITIES)[number];

export type FactoryRegistration = {
  factoryKey: string;
  factoryName: string;
  series: string;
  missionId: string;
  registeredAt: string;
  healthStatus: EngineHealthStatus | string;
  fabricated: false;
  evidencePresent: boolean;
  metadataVersion?: string;
  notes?: string[];
  neverReplaceFactoryLogic?: true;
  neverReplaceWorkerLogic?: true;
  neverExecuteBusinessSpecificDecisions?: true;
  neverFabricateRuntimeState?: true;
  neverImplementQ1002OrLater?: true;
  structuralSignalOnly?: true;
};

export type WorkerRegistration = {
  workerId: string;
  workerName: string;
  factoryKey: string;
  missionId: string;
  registeredAt: string;
  healthStatus: EngineHealthStatus | string;
  fabricated: false;
  evidencePresent: boolean;
  metadataVersion?: string;
  notes?: string[];
  neverReplaceFactoryLogic?: true;
  neverReplaceWorkerLogic?: true;
  neverExecuteBusinessSpecificDecisions?: true;
  neverFabricateRuntimeState?: true;
  neverImplementQ1002OrLater?: true;
  structuralSignalOnly?: true;
};

export type RuntimeServiceRecord = {
  serviceId: string;
  serviceName: RuntimeServiceName | string;
  status: OperationalState | string;
  registeredAt: string;
  version: string;
  fabricated: false;
  notes: string[];
};

export type ExecutionContext = {
  contextId: string;
  createdAt: string;
  propagatedAt: string | null;
  traceabilityRefs: string[];
  factoryKeys: string[];
  workerIds: string[];
  metadata: Record<string, string>;
  metadataVersion: string;
  neverExecuteBusinessSpecificDecisions: true;
  structuralSignalOnly: true;
};

export type RoutingRecord = {
  routeId: string;
  timestamp: string;
  sourceFactory: string;
  targetFactory: string;
  service: string;
  routingStatus: RoutingStatus | string;
  businessLogicInvoked: false;
  notes: string[];
  traceabilityRefs: string[];
  metadataVersion: string;
};

export type DependencyStatus = {
  target: string;
  status: DependencyStatusValue | string;
  probed: boolean;
  fabricated: false;
  notes: string[];
};

export type SharedRuntimeReport = {
  reportId: string;
  timestamp: string;
  runtimeVersion: string;
  registeredFactories: FactoryRegistration[];
  registeredWorkers: WorkerRegistration[];
  runtimeServices: RuntimeServiceRecord[];
  activeRuntimeState: OperationalState | string;
  dependencyStatus: DependencyStatus[];
  routingStatus: RoutingStatus | string;
  healthStatus: EngineHealthStatus | string;
  runtimeDiagnostics: RuntimeDiagnosticsSnapshot;
  supportingEvidence: string[];
  auditStatus: AuditStatus;
  outstandingIssues: string[];
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  consumableByQ1002: boolean;
  neverReplaceFactoryLogic: true;
  neverReplaceWorkerLogic: true;
  neverExecuteBusinessSpecificDecisions: true;
  neverFabricateRuntimeState: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1002OrLater: true;
  preserveCompleteTraceability: true;
  preserveRuntimeHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type Q1002ConsumableContract = {
  contractId: string;
  contractVersion: string;
  producedBy: "shared-runtime-core";
  missionId: "Q10-01";
  consumerMissionId: "Q10-02";
  exposedFields: string[];
  runtimeServiceCatalog: string[];
  factoryKeyCatalog: string[];
  lifecycleStatuses: string[];
  notes: string[];
  neverImplementQ1002OrLater: true;
  structuralSignalOnly: true;
};

export type SrtcInput = {
  grandKingInstructions?: string;
  pillowCommandConfirmed?: boolean;
  grandKingApproved?: boolean;
  validated?: boolean;
  forceFail?: boolean;
  fabricated?: boolean;
  implementQ1002OrLater?: boolean;
  replaceFactoryLogic?: boolean;
  replaceWorkerLogic?: boolean;
  executeBusinessSpecificDecisions?: boolean;
  fabricateRuntimeState?: boolean;
  bypassGrandKingApproval?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  overrideApprovedArchitecture?: boolean;
  missionId?: string | null;
  sourceFactory?: string;
  targetFactory?: string;
  service?: string;
  workerDescriptors?: WorkerRegistration[];
  factoryDescriptors?: FactoryRegistration[];
};

export type SharedRuntimeCoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SrtcRunReport = {
  action: string;
  runTimestamp: string;
  durationMs: number;
  decision: "pass" | "partial" | "fail";
  validation: SharedRuntimeCoreValidationReport;
  sharedRuntimeReport: SharedRuntimeReport | null;
  routingRecord: RoutingRecord | null;
  executionContext: ExecutionContext | null;
  topology: RuntimeTopology | null;
  errors: string[];
  warnings: string[];
};

export type RuntimeDiagnosticsSnapshot = {
  diagnosticsId: string;
  timestamp: string;
  totalFactories: number;
  totalWorkers: number;
  totalServices: number;
  totalRoutes: number;
  integrationHandshakes: IntegrationHandshake[];
  notes: string[];
};

export type IntegrationHandshake = {
  target: string;
  available: boolean;
  probed: boolean;
  notes: string[];
};

export type SharedRuntimeCoreEngineRecord = {
  engineId: string;
  workerId: string;
  operationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  totalFactories: number;
  totalWorkers: number;
  totalServices: number;
  totalRoutes: number;
  lastReportId: string | null;
  supportedCapabilities: SharedRuntimeCoreCapability[];
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type RuntimeTopology = {
  topologyId: string;
  timestamp: string;
  factories: Array<{ factoryKey: string; factoryName: string; series: string; healthStatus: string }>;
  workers: Array<{ workerId: string; workerName: string; factoryKey: string; healthStatus: string }>;
  services: Array<{ serviceName: string; status: string }>;
  routes: Array<{ sourceFactory: string; targetFactory: string; service: string; routingStatus: string }>;
  dependencies: DependencyStatus[];
};

export type SharedRuntimeCoreCatalog = {
  catalogId: string;
  timestamp: string;
  factories: FactoryRegistration[];
  workers: WorkerRegistration[];
  services: RuntimeServiceRecord[];
  integrationHandshakes: IntegrationHandshake[];
  metadataVersion: string;
};

export type SharedRuntimeCoreState = {
  engineVersion: "PILLOW-SRTC-001";
  missionId: "Q10-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: SharedRuntimeCoreConfiguration;
  latestReport: SrtcRunReport | null;
  engineRecord: SharedRuntimeCoreEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalFactories: number;
    totalWorkers: number;
    lastReportId: string | null;
    notes: string[];
  };
};

export type SharedRuntimeCoreCockpitSnapshot = {
  missionId: "Q10-01";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalFactories: number;
  totalWorkers: number;
  totalServices: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverReplaceFactoryLogic: true;
  neverReplaceWorkerLogic: true;
  neverExecuteBusinessSpecificDecisions: true;
  neverFabricateRuntimeState: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1002OrLater: true;
  structuralSignalOnly: true;
};
