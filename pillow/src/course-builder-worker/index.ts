export {
  CourseBuilderWorker,
  createCourseBuilderWorker,
  resetCourseBuilderWorkerForTesting,
  type CourseBuilderWorkerOptions,
} from "./engine.js";
export type { CourseBuilderWorkerDependencies } from "./integrations.js";
export {
  buildCourseBuilderWorkerConfiguration,
  DEFAULT_COURSE_BUILDER_WORKER_CONFIGURATION,
  type CourseBuilderWorkerConfiguration,
} from "./configuration.js";
export {
  COURSE_BUILDER_WORKER_ID,
  COURSE_BUILDER_WORKER_SYSTEM_PATH,
  COURSE_BUILDER_WORKER_IDENTITY,
  CBW_METADATA_VERSION,
  COURSE_BUILDER_REPORT_VERSION,
  PRODUCT_TYPES as CBW_PRODUCT_TYPES,
  EXPORT_FORMATS as CBW_EXPORT_FORMATS,
  RESEARCH_COMPLIANCE_LEVELS as CBW_RESEARCH_COMPLIANCE_LEVELS,
  CBW_CAPABILITIES,
  INTEGRATION_TARGETS as CBW_INTEGRATION_TARGETS,
} from "./paths.js";
export type {
  CourseBuilderWorkerState,
  CourseBuilderReport,
  CourseBuilderReport as CbwCourseBuilderReport,
  CourseBuilderWorkerInput,
  CourseBuilderWorkerRunReport,
  CourseBuilderWorkerCatalog,
  CourseBuilderWorkerCockpitSnapshot,
  CourseBuilderWorkerEngineRecord,
  CourseBuilderWorkerValidationReport,
  CourseLesson as CbwCourseLesson,
  CourseModule as CbwCourseModule,
  CourseModuleStructureEntry as CbwModuleStructureEntry,
  CourseCurriculum as CbwCourseCurriculum,
  CourseQuiz as CbwCourseQuiz,
  CourseResource as CbwCourseResource,
  ProductType as CbwProductType,
  ExportFormat as CbwExportFormat,
  IntegrationHandshake as CbwIntegrationHandshake,
  SelfReviewFinding as CbwSelfReviewFinding,
} from "./types.js";
export { resetCourseSequenceForTesting } from "./course-builder.js";
export { appendCbwLog, getCbwLogs, resetCbwLogsForTesting } from "./cbw-logging.js";
