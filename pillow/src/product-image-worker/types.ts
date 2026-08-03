import type { ProductImageWorkerConfiguration } from "./configuration.js";
import type {
  COMPLIANCE_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  IMAGE_QUALITY_STATUSES,
  INTEGRATION_TARGETS,
  MARKETPLACE_TARGETS,
  OPERATIONAL_STATES,
  PIW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ImageQualityStatus = (typeof IMAGE_QUALITY_STATUSES)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export type MarketplaceTarget = (typeof MARKETPLACE_TARGETS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ProductImageWorkerCapability = (typeof PIW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

/** Approved supplier image input (read-only originals). */
export type SourceImageInput = {
  imageId?: string | null;
  sourceUri?: string | null;
  fileName?: string | null;
  widthPx?: number | null;
  heightPx?: number | null;
  format?: string | null;
  contentHash?: string | null;
  hasWatermark?: boolean | null;
  hasTextOverlay?: boolean | null;
  isPrimary?: boolean | null;
  supplierAssetId?: string | null;
};

export type ProcessedImageRecord = {
  processedImageId: string;
  sourceImageId: string;
  derivedUri: string;
  widthPx: number;
  heightPx: number;
  format: string;
  role: "primary" | "gallery" | "variant" | "rejected";
  qualityNotes: string[];
  originalPreserved: true;
};

export type ImageVariantRecord = {
  variantId: string;
  sourceImageId: string;
  marketplace: MarketplaceTarget;
  widthPx: number;
  heightPx: number;
  format: string;
  purpose: string;
  derivedUri: string;
};

export type ImageMetadataRecord = {
  sourceImageId: string;
  widthPx: number | null;
  heightPx: number | null;
  format: string | null;
  contentHash: string | null;
  supplierAssetId: string | null;
  preservedAt: string;
};

/** Machine-readable Product Image Report (Q3-07). */
export type ProductImageReport = {
  imageReportId: string;
  timestamp: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  evaluationId: string | null;
  discoveryId: string | null;
  sourceImages: SourceImageInput[];
  processedImages: ProcessedImageRecord[];
  imageQualityStatus: ImageQualityStatus;
  complianceStatus: ComplianceStatus;
  imageVariants: ImageVariantRecord[];
  processingSummary: string;
  marketplaceTargets: MarketplaceTarget[];
  duplicateImageIds: string[];
  unusableImageIds: string[];
  preservedMetadata: ImageMetadataRecord[];
  packageId: string;
  supportingEvidence: EvidenceItem[];
  confidenceScore: number;
  businessMissionId: string | null;
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverPublishListings: true;
  neverGenerateAdvertisements: true;
  neverContactSuppliers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ308OrLater: true;
  neverOverwriteOriginalSourceAssets: true;
  preserveOriginalSupplierAssets: true;
  maintainSupplierTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ProductImageWorkerInput = {
  imageReportId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  evaluationId?: string | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
  sourceImages?: SourceImageInput[] | null;
  marketplaceTargets?: Array<MarketplaceTarget | string> | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  publishListings?: boolean;
  generateAdvertisements?: boolean;
  contactSuppliers?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ308OrLater?: boolean;
  overwriteOriginalSourceAssets?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ProductImageWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProductImageWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PIW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ProductImageWorkerCapability[];
  totalImageReports: number;
  lastImageQualityStatus: ImageQualityStatus | null;
  lastComplianceStatus: ComplianceStatus | null;
  lastImageReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ProductImageWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  imageReports: ProductImageReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverPublishListings: true;
  neverGenerateAdvertisements: true;
  neverContactSuppliers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverOverwriteOriginalSourceAssets: true;
};

export type ProductImageWorkerRunReport = {
  imageRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_images"
    | "validate_image_quality"
    | "detect_duplicates"
    | "organize_image_sets"
    | "prepare_compliant_images"
    | "generate_variants"
    | "preserve_metadata"
    | "validate_compliance"
    | "package_assets"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ProductImageWorkerEngineRecord;
  catalog: ProductImageWorkerCatalog | null;
  imageReports: ProductImageReport[];
  latestImageReport: ProductImageReport | null;
  integrations: IntegrationHandshake[];
  validation: ProductImageWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProductImageWorkerState = {
  engineVersion: "PILLOW-PIW-001";
  missionId: "Q3-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProductImageWorkerConfiguration;
  latestReport: ProductImageWorkerRunReport | null;
  engineRecord: ProductImageWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalImageReports: number;
    lastImageReportId: string | null;
    lastImageQualityStatus: ImageQualityStatus | null;
    lastComplianceStatus: ComplianceStatus | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ProductImageWorkerCockpitSnapshot = {
  missionId: "Q3-07";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalImageReports: number;
  latestImageReportId: string | null;
  lastImageQualityStatus: ImageQualityStatus | null;
  lastComplianceStatus: ComplianceStatus | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverPublishListings: true;
  neverGenerateAdvertisements: true;
  neverContactSuppliers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverOverwriteOriginalSourceAssets: true;
};
