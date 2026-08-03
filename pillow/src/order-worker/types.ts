import type { OrderWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  EXCEPTION_SEVERITIES,
  FULFILMENT_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  ORDER_STATUSES,
  ORW_CAPABILITIES,
  SHIPPING_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number] | (string & {});
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];
export type ExceptionSeverity = (typeof EXCEPTION_SEVERITIES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type OrderWorkerCapability = (typeof ORW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

export type OrderException = {
  exceptionId: string;
  severity: ExceptionSeverity;
  code: string;
  message: string;
  detectedAt: string;
};

export type CustomerUpdate = {
  updateId: string;
  channel: string;
  message: string;
  generatedAt: string;
  status: string;
};

export type OrderEscalation = {
  escalationId: string;
  severity: ExceptionSeverity;
  reason: string;
  escalatedAt: string;
  target: "pillow";
};

export type HistoryEvent = {
  eventId: string;
  status: string;
  note: string;
  recordedAt: string;
};

/** Confirmed customer order inputs for lifecycle operations (read-only financially). */
export type ConfirmedOrderInput = {
  orderId?: string | null;
  customerId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  quantity?: number | null;
  orderStatus?: OrderStatus | string | null;
  fulfilmentStatus?: FulfilmentStatus | string | null;
  shippingStatus?: ShippingStatus | string | null;
  expectedShipDate?: string | null;
  actualShipDate?: string | null;
  orderReceivedAt?: string | null;
  delayDaysThreshold?: number | null;
  inventoryReportId?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
};

/** Machine-readable Order Report (Q3-11). */
export type OrderReport = {
  orderReportId: string;
  timestamp: string;
  orderId: string;
  customerId: string;
  productId: string;
  productName: string;
  supplierId: string | null;
  supplierName: string | null;
  quantity: number;
  orderStatus: OrderStatus;
  fulfilmentStatus: FulfilmentStatus;
  shippingStatus: ShippingStatus;
  routedSupplierId: string | null;
  routingRationale: string;
  exceptions: OrderException[];
  customerUpdates: CustomerUpdate[];
  escalations: OrderEscalation[];
  fulfilmentHistory: HistoryEvent[];
  orderHistory: HistoryEvent[];
  recommendedAction: string;
  confidenceScore: number;
  expectedShipDate: string | null;
  actualShipDate: string | null;
  daysSinceOrder: number;
  delayed: boolean;
  failedFulfilment: boolean;
  inventoryReportId: string | null;
  evaluationId: string | null;
  discoveryId: string | null;
  businessMissionId: string | null;
  supportingEvidence: EvidenceItem[];
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverProcessPayments: true;
  neverIssueRefunds: true;
  neverModifyInventoryDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ312OrLater: true;
  neverAlterFinancialRecords: true;
  preserveOrderTraceability: true;
  preserveFulfilmentHistory: true;
  preserveSupplierReferences: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type OrderWorkerInput = {
  orderReportId?: string | null;
  confirmedOrder?: ConfirmedOrderInput | null;
  orderId?: string | null;
  customerId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  quantity?: number | null;
  orderStatus?: OrderStatus | string | null;
  fulfilmentStatus?: FulfilmentStatus | string | null;
  shippingStatus?: ShippingStatus | string | null;
  expectedShipDate?: string | null;
  actualShipDate?: string | null;
  orderReceivedAt?: string | null;
  delayDaysThreshold?: number | null;
  inventoryReportId?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  processPayments?: boolean;
  issueRefunds?: boolean;
  modifyInventory?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ312OrLater?: boolean;
  alterFinancialRecords?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type OrderWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OrderWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-ORW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: OrderWorkerCapability[];
  totalOrderReports: number;
  lastOrderReportId: string | null;
  lastOrderStatus: OrderStatus | null;
  lastFulfilmentStatus: FulfilmentStatus | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type OrderWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  orderReports: OrderReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverProcessPayments: true;
  neverIssueRefunds: true;
  neverModifyInventoryDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverAlterFinancialRecords: true;
};

export type OrderWorkerRunReport = {
  orderRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_confirmed_orders"
    | "route_to_supplier"
    | "track_fulfilment"
    | "track_shipment"
    | "detect_exceptions"
    | "detect_delayed"
    | "detect_failed_fulfilment"
    | "generate_customer_updates"
    | "escalate_issues"
    | "maintain_history"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: OrderWorkerEngineRecord;
  catalog: OrderWorkerCatalog | null;
  orderReports: OrderReport[];
  latestOrderReport: OrderReport | null;
  integrations: IntegrationHandshake[];
  validation: OrderWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OrderWorkerState = {
  engineVersion: "PILLOW-ORW-001";
  missionId: "Q3-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: OrderWorkerConfiguration;
  latestReport: OrderWorkerRunReport | null;
  engineRecord: OrderWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalOrderReports: number;
    lastOrderReportId: string | null;
    lastOrderStatus: OrderStatus | null;
    lastFulfilmentStatus: FulfilmentStatus | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type OrderWorkerCockpitSnapshot = {
  missionId: "Q3-11";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalOrderReports: number;
  latestOrderReportId: string | null;
  lastOrderStatus: OrderStatus | null;
  lastFulfilmentStatus: FulfilmentStatus | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverProcessPayments: true;
  neverIssueRefunds: true;
  neverModifyInventoryDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverAlterFinancialRecords: true;
};
