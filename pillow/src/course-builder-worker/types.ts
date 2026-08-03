import type { CourseBuilderWorkerConfiguration } from "./configuration.js";
import type {
  CBW_CAPABILITIES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EXPORT_FORMATS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PRODUCT_TYPES,
  RESEARCH_COMPLIANCE_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type CourseBuilderWorkerCapability = (typeof CBW_CAPABILITIES)[number];

export type CourseModuleStructureEntry = {
  moduleNumber: number;
  title: string;
  summary?: string;
  lessonCount?: number;
};

export type CourseCurriculum = {
  title: string;
  subtitle: string;
  tableOfContents: string[];
  moduleTitles: string[];
  learningObjectives: string[];
};

export type CourseLesson = {
  lessonId: string;
  moduleNumber: number;
  lessonNumber: number;
  title: string;
  learningObjectives: string[];
  body: string;
  estimatedMinutes: number;
};

export type CourseModule = {
  moduleNumber: number;
  title: string;
  summary: string;
  lessonIds: string[];
};

export type CourseQuizQuestion = {
  questionId: string;
  prompt: string;
  options?: string[];
  answerHint?: string;
};

export type CourseQuiz = {
  quizId: string;
  moduleNumber: number;
  title: string;
  questions: CourseQuizQuestion[];
};

export type CourseResourceType = "worksheet" | "checklist" | "template" | "reading" | "unknown";

export type CourseResource = {
  resourceId: string;
  title: string;
  resourceType: CourseResourceType;
  description: string;
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

/** Machine-readable Course Builder Report (Q5-05). */
export type CourseBuilderReport = {
  courseId: string;
  timestamp: string;
  productId: string;
  courseTitle: string;
  targetAudience: string;
  learningObjectives: string[];
  moduleStructure: CourseModuleStructureEntry[];
  lessonCount: number;
  quizCount: number;
  resourceCount: number;
  qualityReview: string;
  exportFormats: string[];
  confidenceScore: number;
  metadataVersion: string;
  researchReportId: string | null;
  opportunityId: string | null;
  businessId: string;
  factoryMissionId: string;
  productType: ProductType;
  curriculum: CourseCurriculum | null;
  modules: CourseModule[];
  lessons: CourseLesson[];
  quizzes: CourseQuiz[];
  resources: CourseResource[];
  instructionalFlowValidated: boolean;
  selfReviewPassed: boolean;
  selfReviewFindings: SelfReviewFinding[];
  selfReviewSummary: string;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverCoursesToCustomers: true;
  neverPublishCoursesDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ506OrLater: true;
  followApprovedProductResearch: true;
  followApprovedProductIntent: true;
  produceOriginalCourseMaterial: true;
  preserveCompleteTraceability: true;
  validateEducationalQuality: true;
  performSelfReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type CourseContext = {
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  productTitle?: string | null;
  courseTitle?: string | null;
  productType?: ProductType | null;
  targetAudience?: string | null;
  customerPainPoints?: string[];
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  receivedResearch?: boolean;
};

export type CourseBuilderWorkerInput = {
  courseId?: string | null;
  productId?: string | null;
  productTitle?: string | null;
  courseTitle?: string | null;
  productType?: ProductType | string | null;
  targetAudience?: string | null;
  researchReportId?: string | null;
  opportunityId?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  customerPainPoints?: string[] | null;
  marketGap?: string | null;
  demandAssessment?: string | null;
  researchTopic?: string | null;
  moduleCount?: number | null;
  lessonsPerModule?: number | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  buildSalesPages?: boolean;
  processPayments?: boolean;
  deliverCoursesToCustomers?: boolean;
  publishCoursesDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ506OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type CourseBuilderWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CourseBuilderWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CBW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CourseBuilderWorkerCapability[];
  totalCourses: number;
  lastCourseId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type CourseBuilderWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  courses: CourseBuilderReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverCoursesToCustomers: true;
  neverPublishCoursesDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type CourseBuilderWorkerRunReport = {
  courseRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_digital_product_research"
    | "design_complete_course_curriculum"
    | "organize_modules"
    | "create_lessons"
    | "generate_quizzes_and_assessments"
    | "generate_downloadable_resources"
    | "create_learning_objectives"
    | "validate_instructional_flow"
    | "package_export_ready_course_assets"
    | "produce_course_builder_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: CourseBuilderWorkerEngineRecord;
  catalog: CourseBuilderWorkerCatalog | null;
  courses: CourseBuilderReport[];
  latestCourse: CourseBuilderReport | null;
  integrations: IntegrationHandshake[];
  validation: CourseBuilderWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CourseBuilderWorkerState = {
  engineVersion: "PILLOW-CBW-001";
  missionId: "Q5-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: CourseBuilderWorkerConfiguration;
  latestReport: CourseBuilderWorkerRunReport | null;
  engineRecord: CourseBuilderWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalCourses: number;
    lastCourseId: string | null;
    lastProductType: ProductType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type CourseBuilderWorkerCockpitSnapshot = {
  missionId: "Q5-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalCourses: number;
  latestCourseId: string | null;
  lastProductType: ProductType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverCoursesToCustomers: true;
  neverPublishCoursesDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  qualityReview: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  instructionalFlowValidated: boolean;
};
