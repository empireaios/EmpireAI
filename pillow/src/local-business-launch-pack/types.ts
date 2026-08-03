import type { LocalBusinessLaunchPackConfiguration } from "./configuration.js";
import type {
  APPROVAL_RECOMMENDATIONS,
  AUDIT_STATUSES,
  CRITICAL_DELIVERABLE_ITEMS,
  DELIVERABLE_ITEMS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  LBLP_CAPABILITIES,
  OPERATIONAL_STATES,
  READINESS_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];
export type ApprovalRecommendation = (typeof APPROVAL_RECOMMENDATIONS)[number];
export type AuditStatus = (typeof AUDIT_STATUSES)[number];
export type DeliverableItem = (typeof DELIVERABLE_ITEMS)[number];
export type CriticalDeliverableItem = (typeof CRITICAL_DELIVERABLE_ITEMS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type LocalBusinessLaunchPackCapability = (typeof LBLP_CAPABILITIES)[number];

/* ------------------------------------------------------------------------ */
/* Deterministic fixtures mirroring each Q7-01..Q7-09 worker report shape.  */
/* Fixtures are never fabricated evidence — they represent externally      */
/* supplied artefacts (tests / offline design) standing in for live worker */
/* reports. Absence of a fixture AND absence of an injected worker report  */
/* means the deliverable is genuinely missing.                              */
/* ------------------------------------------------------------------------ */

export type LbfcFixture = {
  businessProjectId?: string;
  businessName?: string;
  businessCategory?: string;
  currentLifecycleStage?: string;
  approvalStatus?: string;
  launchReadiness?: string;
  confidenceScore?: number;
};

export type MarketResearchFixture = {
  reportId?: string;
  businessProjectId?: string;
  targetCity?: string;
  targetServiceArea?: string;
  serviceCategory?: string;
  executiveSummary?: string;
  opportunityFindingsCount?: number;
  confidenceScore?: number;
};

export type ServiceOfferFixture = {
  reportId?: string;
  businessProjectId?: string;
  servicePackagesCount?: number;
  pricingRecommendationsCount?: number;
  currency?: string;
  executiveSummary?: string;
  confidenceScore?: number;
};

export type BookingFixture = {
  reportId?: string;
  businessProjectId?: string;
  bookingId?: string;
  bookingStatus?: string;
  confidenceScore?: number;
};

export type CrmFixture = {
  reportId?: string;
  businessProjectId?: string;
  customerId?: string;
  leadStatus?: string;
  customerLifecycleStage?: string;
  confidenceScore?: number;
};

export type WhatsAppFixture = {
  reportId?: string;
  businessProjectId?: string;
  conversationId?: string;
  conversationStatus?: string;
  confidenceScore?: number;
};

export type LocalSeoFixture = {
  reportId?: string;
  businessProjectId?: string;
  landingPagesGeneratedCount?: number;
  confidenceScore?: number;
};

export type LeadGenerationFixture = {
  reportId?: string;
  businessProjectId?: string;
  funnelId?: string;
  confidenceScore?: number;
};

export type OperationsFixture = {
  reportId?: string;
  businessProjectId?: string;
  workflowId?: string;
  operationalStagesCount?: number;
  confidenceScore?: number;
};

/* ------------------------------------------------------------------------ */
/* Collected artefact envelope — records presence/absence honestly.         */
/* ------------------------------------------------------------------------ */

export type ArtefactSourceKind = "fixture" | "worker" | "none";

export type CollectedArtefact<TSummary> = {
  present: boolean;
  source: ArtefactSourceKind;
  summary: TSummary | null;
  evidenceRefs: string[];
  reportId: string | null;
  confidenceScore: number | null;
};

export type LbfcArtefactSummary = {
  businessProjectId: string;
  businessName: string;
  businessCategory: string | null;
  currentLifecycleStage: string | null;
  approvalStatus: string | null;
  launchReadiness: string | null;
};

export type MarketResearchArtefactSummary = {
  reportId: string;
  targetCity: string | null;
  targetServiceArea: string | null;
  serviceCategory: string | null;
  executiveSummary: string | null;
  opportunityCount: number;
  confidenceScore: number | null;
};

export type ServiceOfferArtefactSummary = {
  reportId: string;
  packageCount: number;
  pricingRecommendationCount: number;
  currency: string | null;
  executiveSummary: string | null;
  confidenceScore: number | null;
};

export type BookingArtefactSummary = {
  reportId: string | null;
  bookingId: string | null;
  bookingStatus: string | null;
  confirmed: boolean;
  confidenceScore: number | null;
};

export type CrmArtefactSummary = {
  reportId: string;
  customerId: string | null;
  leadStatus: string | null;
  customerLifecycleStage: string | null;
  confidenceScore: number | null;
};

export type WhatsAppArtefactSummary = {
  reportId: string;
  conversationId: string | null;
  conversationStatus: string | null;
  confidenceScore: number | null;
};

export type LocalSeoArtefactSummary = {
  reportId: string;
  landingPageCount: number;
  confidenceScore: number | null;
};

export type LeadGenerationArtefactSummary = {
  reportId: string;
  funnelId: string | null;
  confidenceScore: number | null;
};

export type OperationsArtefactSummary = {
  reportId: string;
  workflowId: string | null;
  operationalStagesCount: number;
  confidenceScore: number | null;
};

export type CollectedFactoryOutputs = {
  collectionId: string;
  businessProjectId: string;
  collectedAt: string;
  lbfc: CollectedArtefact<LbfcArtefactSummary>;
  marketResearch: CollectedArtefact<MarketResearchArtefactSummary>;
  serviceOffer: CollectedArtefact<ServiceOfferArtefactSummary>;
  booking: CollectedArtefact<BookingArtefactSummary>;
  crm: CollectedArtefact<CrmArtefactSummary>;
  whatsApp: CollectedArtefact<WhatsAppArtefactSummary>;
  localSeo: CollectedArtefact<LocalSeoArtefactSummary>;
  leadGeneration: CollectedArtefact<LeadGenerationArtefactSummary>;
  operations: CollectedArtefact<OperationsArtefactSummary>;
  sourcesPresent: DeliverableItem[];
  sourcesMissing: DeliverableItem[];
  neverInventMissingReports: true;
};

/* ------------------------------------------------------------------------ */
/* Deliverable verification.                                                */
/* ------------------------------------------------------------------------ */

export type DeliverableVerificationItem = {
  item: DeliverableItem;
  label: string;
  present: boolean;
  required: true;
  critical: boolean;
  evidenceRefs: string[];
  notes: string;
};

export type DeliverableVerification = {
  verificationId: string;
  businessProjectId: string;
  verifiedAt: string;
  items: DeliverableVerificationItem[];
  requiredCount: number;
  presentCount: number;
  allRequiredPresent: boolean;
  missingItems: DeliverableItem[];
  criticalItemsMissing: DeliverableItem[];
};

/* ------------------------------------------------------------------------ */
/* Launch package sections — extensible; every section is evidence-backed   */
/* or explicitly marked as evidence-missing / not-assessed.                 */
/* ------------------------------------------------------------------------ */

export type LaunchPackageSectionStatus = "evidenced" | "evidence_missing";

export type LaunchPackageSection = {
  status: LaunchPackageSectionStatus;
  summary: string;
  evidenceRefs: string[];
  data: Record<string, unknown>;
};

export type LaunchPackageSections = {
  executiveSummary: string;
  businessOverview: LaunchPackageSection;
  targetMarket: LaunchPackageSection;
  serviceCatalogue: LaunchPackageSection;
  pricingSummary: LaunchPackageSection;
  bookingReadiness: LaunchPackageSection;
  crmReadiness: LaunchPackageSection;
  whatsAppReadiness: LaunchPackageSection;
  localSeoReadiness: LaunchPackageSection;
  leadGenerationReadiness: LaunchPackageSection;
  operationsReadiness: LaunchPackageSection;
  risks: string[];
  assumptions: string[];
  outstandingItems: string[];
  approvalRecommendation: ApprovalRecommendation;
};

export type LaunchPackage = {
  packageId: string;
  businessProjectId: string;
  businessName: string;
  businessType: string;
  createdAt: string;
  updatedAt: string;
  collection: CollectedFactoryOutputs;
  verification: DeliverableVerification;
  sections: LaunchPackageSections;
  status: "draft" | "assembled";
  neverLaunchBusinessAutomatically: true;
  neverReplaceCertification: true;
};

export type ReadinessAssessment = {
  assessedAt: string;
  businessProjectId: string;
  readinessStatus: ReadinessStatus;
  requiredCount: number;
  presentCount: number;
  missingItems: DeliverableItem[];
  criticalItemsMissing: DeliverableItem[];
  confidenceScore: number;
  notes: string[];
};

/* ------------------------------------------------------------------------ */
/* Local Business Launch Report — the Q7-10 output consumable by Q7-11.     */
/* ------------------------------------------------------------------------ */

export type LocalBusinessLaunchPackValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LocalBusinessLaunchReport = {
  reportId: string;
  timestamp: string;
  businessProjectId: string;
  businessName: string;
  businessType: string;
  executiveSummary: string;
  deliverableVerification: DeliverableVerification;
  readinessStatus: ReadinessStatus;
  riskSummary: string[];
  outstandingIssues: string[];
  approvalRecommendation: ApprovalRecommendation;
  auditStatus: AuditStatus;
  confidenceScore: number;
  metadataVersion: string;
  reportVersion: string;
  workerId: string;
  packageId: string;
  launchPackage: LaunchPackageSections;
  readinessAssessment: ReadinessAssessment;
  validation: LocalBusinessLaunchPackValidationReport;
  runTimestamp: string;
  consumableByQ711: true;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  traceabilityRefs: string[];
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverLaunchBusinessAutomatically: true;
  neverOverrideGovernance: true;
  neverReplaceCertification: true;
  neverClaimReadinessWithoutEvidence: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ711OrLater: true;
};

export type LblpInput = {
  reportId?: string | null;
  packageId?: string | null;
  collectionId?: string | null;
  businessProjectId?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  category?: string | null;
  city?: string | null;
  area?: string | null;
  country?: string | null;
  fixtureLbfc?: LbfcFixture | null;
  fixtureMarketResearch?: MarketResearchFixture | null;
  fixtureServiceOffer?: ServiceOfferFixture | null;
  fixtureBooking?: BookingFixture | null;
  fixtureCrm?: CrmFixture | null;
  fixtureWhatsApp?: WhatsAppFixture | null;
  fixtureLocalSeo?: LocalSeoFixture | null;
  fixtureLeadGeneration?: LeadGenerationFixture | null;
  fixtureOperations?: OperationsFixture | null;
  grandKingInstructions?: string | null;
  missionId?: string | null;
  validated?: boolean;
  grandKingApproved?: boolean;
  pillowCommandConfirmed?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  launchBusinessAutomatically?: boolean;
  overrideGovernance?: boolean;
  replaceCertification?: boolean;
  claimReadinessWithoutEvidence?: boolean;
  overrideApprovedArchitecture?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  bypassGrandKingApproval?: boolean;
  implementQ711OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type LblpEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-LBLP-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LocalBusinessLaunchPackCapability[];
  totalPackages: number;
  totalReports: number;
  lastPackageId: string | null;
  lastReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type LblpCatalog = {
  reportVersion: string;
  workerId: string;
  reports: LocalBusinessLaunchReport[];
  packages: LaunchPackage[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverLaunchBusinessAutomatically: true;
  neverOverrideGovernance: true;
  neverReplaceCertification: true;
  neverClaimReadinessWithoutEvidence: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ711OrLater: true;
  consumableByQ711: true;
};

export type LblpRunReport = {
  lblpRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "collect_factory_outputs"
    | "verify_deliverables"
    | "generate_executive_launch_package"
    | "produce_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: LblpEngineRecord;
  catalog: LblpCatalog | null;
  reports: LocalBusinessLaunchReport[];
  packages: LaunchPackage[];
  latestReport: LocalBusinessLaunchReport | null;
  latestPackage: LaunchPackage | null;
  latestCollection: CollectedFactoryOutputs | null;
  latestVerification: DeliverableVerification | null;
  integrations: IntegrationHandshake[];
  validation: LocalBusinessLaunchPackValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LocalBusinessLaunchPackState = {
  engineVersion: "PILLOW-LBLP-001";
  missionId: "Q7-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: LocalBusinessLaunchPackConfiguration;
  latestReport: LblpRunReport | null;
  engineRecord: LblpEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalPackages: number;
    totalReports: number;
    lastPackageId: string | null;
    lastReportId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type LocalBusinessLaunchPackCockpitSnapshot = {
  missionId: "Q7-10";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalPackages: number;
  totalReports: number;
  latestReportId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverLaunchBusinessAutomatically: true;
  neverOverrideGovernance: true;
  neverReplaceCertification: true;
  neverClaimReadinessWithoutEvidence: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ711OrLater: true;
  consumableByQ711: true;
};

/** Stable subset contract for Q7-11 downstream consumers. */
export type Q711ConsumableContract = {
  contractVersion: "LBLP-Q711-v1";
  consumableByQ711: true;
  fields: readonly string[];
  types: {
    LocalBusinessLaunchReport: "LocalBusinessLaunchReport";
    LaunchPackage: "LaunchPackage";
    LaunchPackageSections: "LaunchPackageSections";
    DeliverableVerification: "DeliverableVerification";
    ReadinessAssessment: "ReadinessAssessment";
  };
  notes: string[];
  neverLaunchBusinessAutomatically: true;
  neverOverrideGovernance: true;
  neverReplaceCertification: true;
  neverClaimReadinessWithoutEvidence: true;
};
