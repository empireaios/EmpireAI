import type { DigitalDeliveryWorkerConfiguration } from "./configuration.js";
import type {
  DELIVERY_METHODS,
  DELIVERY_STATUSES,
  DELIVERY_TYPES,
  DDW_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  RESEARCH_COMPLIANCE_LEVELS,
  RETRY_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type DeliveryType = (typeof DELIVERY_TYPES)[number];
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type RetryStatus = (typeof RETRY_STATUSES)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type DigitalDeliveryWorkerCapability = (typeof DDW_CAPABILITIES)[number];

export type DeliveryStep = {
  stepId: string;
  stepType: string;
  title: string;
  order: number;
  summary?: string;
};

export type DeliveredAsset = {
  assetId: string;
  assetLabel: string;
  assetType: string;
  deliveryChannel: string;
};

export type AccessGrant = {
  grantId: string;
  accessType: string;
  scope: string;
  expiresAtPlaceholder: string;
};

/** Structural secure download link — never live tokens or secrets. */
export type SecureDownloadLink = {
  linkId: string;
  assetId: string;
  urlPlaceholder: string;
  expiresAtPlaceholder: string;
  authorized: true;
  tokenPresent: false;
};

export type FulfilmentConfirmation = {
  confirmed: boolean;
  confirmationId: string;
  customerFacingSummary: string;
  confirmedAt: string;
};

export type DeliveryValidationResults = {
  summary: string;
  errors: string[];
  warnings: string[];
  eligibilityVerified: boolean;
  fulfilmentReady: boolean;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type SelfReviewFinding = {
  findingId: string;
  category: string;
  severity: "info" | "warning" | "error";
  message: string;
};

/** Machine-readable Digital Delivery Report (Q5-10). */
export type DigitalDeliveryReport = {
  deliveryId: string;
  timestamp: string;
  orderId: string;
  productId: string;
  customerReference: string;
  deliveredAssets: DeliveredAsset[];
  accessGranted: boolean;
  accessGrants: AccessGrant[];
  deliveryMethod: DeliveryMethod;
  deliveryStatus: DeliveryStatus;
  retryStatus: RetryStatus;
  fulfilmentConfirmation: FulfilmentConfirmation;
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  checkoutId: string | null;
  productTitle: string;
  deliveryType: DeliveryType;
  deliverySteps: DeliveryStep[];
  supportedDeliveryMethods: DeliveryMethod[];
  supportedDeliveryTypes: DeliveryType[];
  secureDownloadLinks: SecureDownloadLink[];
  eligibilityVerified: boolean;
  fulfilmentReady: boolean;
  selfReviewPassed: boolean;
  selfReviewFindings: SelfReviewFinding[];
  selfReviewSummary: string;
  qualityReview: string;
  complianceReview: string;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverProcessPayments: true;
  neverCreateProducts: true;
  neverPublishStorefronts: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ511OrLater: true;
  neverExposeUnauthorizedAccess: true;
  deliverOnlyVerifiedPurchases: true;
  protectCustomerAccess: true;
  preserveCompleteFulfilmentTraceability: true;
  validateSuccessfulDelivery: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type DeliveryContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  checkoutId?: string | null;
  orderId?: string | null;
  productTitle?: string | null;
  productId?: string | null;
  deliveryType?: DeliveryType | null;
  deliveryMethod?: DeliveryMethod | null;
  customerReference?: string | null;
  customerEmail?: string | null;
  assetLabels?: string[];
  checkoutCompletionValidated?: boolean | null;
  purchaseInformationValid?: boolean | null;
  checkoutReady?: boolean | null;
  deliveryHandoffStatus?: string | null;
  receivedValidatedCheckout?: boolean;
};

export type DigitalDeliveryWorkerInput = {
  deliveryId?: string | null;
  orderId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  checkoutId?: string | null;
  customerReference?: string | null;
  customerEmail?: string | null;
  deliveryType?: DeliveryType | string | null;
  deliveryMethod?: DeliveryMethod | string | null;
  assetLabels?: string[] | null;
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  checkoutCompletionValidated?: boolean | null;
  purchaseInformationValid?: boolean | null;
  checkoutReady?: boolean | null;
  deliveryHandoffStatus?: string | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  processPayments?: boolean;
  createProducts?: boolean;
  publishStorefronts?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ511OrLater?: boolean;
  exposeUnauthorizedAccess?: boolean;
  bypassPillowGovernance?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type DigitalDeliveryWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type DigitalDeliveryWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-DDW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: DigitalDeliveryWorkerCapability[];
  totalDeliveries: number;
  lastDeliveryId: string | null;
  lastDeliveryType: DeliveryType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type DigitalDeliveryWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  deliveries: DigitalDeliveryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverProcessPayments: true;
  neverCreateProducts: true;
  neverPublishStorefronts: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ511OrLater: true;
  neverExposeUnauthorizedAccess: true;
};

export type DigitalDeliveryWorkerRunReport = {
  deliveryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_validated_checkout_completion"
    | "verify_fulfilment_eligibility"
    | "deliver_purchased_digital_assets"
    | "grant_product_access"
    | "generate_secure_download_links"
    | "track_delivery_status"
    | "handle_delivery_retries"
    | "detect_fulfilment_failures"
    | "produce_customer_delivery_confirmations"
    | "produce_digital_delivery_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: DigitalDeliveryWorkerEngineRecord;
  catalog: DigitalDeliveryWorkerCatalog | null;
  deliveries: DigitalDeliveryReport[];
  latestDelivery: DigitalDeliveryReport | null;
  integrations: IntegrationHandshake[];
  validation: DigitalDeliveryWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DigitalDeliveryWorkerState = {
  engineVersion: "PILLOW-DDW-001";
  missionId: "Q5-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: DigitalDeliveryWorkerConfiguration;
  latestReport: DigitalDeliveryWorkerRunReport | null;
  engineRecord: DigitalDeliveryWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalDeliveries: number;
    lastDeliveryId: string | null;
    lastDeliveryType: DeliveryType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type DigitalDeliveryWorkerCockpitSnapshot = {
  missionId: "Q5-10";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalDeliveries: number;
  latestDeliveryId: string | null;
  lastDeliveryType: DeliveryType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverProcessPayments: true;
  neverCreateProducts: true;
  neverPublishStorefronts: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ511OrLater: true;
  neverExposeUnauthorizedAccess: true;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  qualityReview: string;
  complianceReview: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  eligibilityVerified: boolean;
  fulfilmentReady: boolean;
};
