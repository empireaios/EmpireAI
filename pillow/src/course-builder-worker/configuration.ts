import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CBW_METADATA_VERSION,
  COURSE_BUILDER_WORKER_IDENTITY,
  INTEGRATION_TARGETS,
  PRODUCT_TYPES,
} from "./paths.js";
import type { CourseBuilderReport } from "./types.js";

export type CourseBuilderWorkerConfiguration = {
  enabled: boolean;
  courseRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultProductType: string;
  supportedProductTypes: string[];
  defaultModuleCount: number;
  defaultLessonsPerModule: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedCourses: CourseBuilderReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-05 hard boundaries — force-locked true. */
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
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_COURSE_BUILDER_WORKER_CONFIGURATION: CourseBuilderWorkerConfiguration = {
  enabled: true,
  courseRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultProductType: "self_paced_course",
  supportedProductTypes: [...PRODUCT_TYPES],
  defaultModuleCount: 4,
  defaultLessonsPerModule: 3,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: COURSE_BUILDER_WORKER_IDENTITY.workerId,
  workerName: COURSE_BUILDER_WORKER_IDENTITY.workerName,
  factory: COURSE_BUILDER_WORKER_IDENTITY.factory,
  department: COURSE_BUILDER_WORKER_IDENTITY.department,
  role: COURSE_BUILDER_WORKER_IDENTITY.role,
  reportingLine: [...COURSE_BUILDER_WORKER_IDENTITY.reportingLine],
  seedCourses: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverBuildSalesPages: true,
  neverProcessPayments: true,
  neverDeliverCoursesToCustomers: true,
  neverPublishCoursesDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ506OrLater: true,
  followApprovedProductResearch: true,
  followApprovedProductIntent: true,
  produceOriginalCourseMaterial: true,
  preserveCompleteTraceability: true,
  validateEducationalQuality: true,
  performSelfReviewBeforeSubmission: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildCourseBuilderWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CourseBuilderWorkerConfiguration> = {},
): CourseBuilderWorkerConfiguration {
  let file: Partial<CourseBuilderWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "course-builder-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.COURSE_BUILDER_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.COURSE_BUILDER_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedProductTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_COURSE_BUILDER_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_COURSE_BUILDER_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedProductTypes: mergeList("supportedProductTypes"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_COURSE_BUILDER_WORKER_CONFIGURATION.reportingLine),
    ],
    seedCourses: (overrides.seedCourses ?? file.seedCourses ?? []).map((c) => lockCourse(c)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverDeliverCoursesToCustomers: true,
    neverPublishCoursesDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ506OrLater: true,
    followApprovedProductResearch: true,
    followApprovedProductIntent: true,
    produceOriginalCourseMaterial: true,
    preserveCompleteTraceability: true,
    validateEducationalQuality: true,
    performSelfReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockCourse(course: CourseBuilderReport): CourseBuilderReport {
  return {
    ...course,
    learningObjectives: [...course.learningObjectives],
    moduleStructure: course.moduleStructure.map((m) => ({ ...m })),
    exportFormats: [...course.exportFormats],
    curriculum: course.curriculum
      ? {
          ...course.curriculum,
          tableOfContents: [...course.curriculum.tableOfContents],
          moduleTitles: [...course.curriculum.moduleTitles],
          learningObjectives: [...course.curriculum.learningObjectives],
        }
      : null,
    modules: course.modules.map((m) => ({ ...m, lessonIds: [...m.lessonIds] })),
    lessons: course.lessons.map((l) => ({
      ...l,
      learningObjectives: [...l.learningObjectives],
    })),
    quizzes: course.quizzes.map((q) => ({
      ...q,
      questions: q.questions.map((question) => ({
        ...question,
        options: question.options ? [...question.options] : undefined,
      })),
    })),
    resources: course.resources.map((r) => ({ ...r })),
    selfReviewFindings: course.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...course.traceabilityRefs],
    preservedDecisions: course.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: course.metadataVersion || CBW_METADATA_VERSION,
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverDeliverCoursesToCustomers: true,
    neverPublishCoursesDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ506OrLater: true,
    followApprovedProductResearch: true,
    followApprovedProductIntent: true,
    produceOriginalCourseMaterial: true,
    preserveCompleteTraceability: true,
    validateEducationalQuality: true,
    performSelfReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
