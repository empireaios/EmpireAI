import { CBW_METADATA_VERSION } from "./paths.js";
import type {
  CourseBuilderReport,
  CourseBuilderWorkerInput,
  CourseBuilderWorkerValidationReport,
} from "./types.js";

type BoundaryInput = {
  buildSalesPages?: boolean;
  processPayments?: boolean;
  deliverCoursesToCustomers?: boolean;
  publishCoursesDirectly?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ506OrLater?: boolean;
  validated?: boolean;
};

export class CourseValidator {
  decide(input: CourseBuilderWorkerInput): CourseBuilderWorkerValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    return "pass";
  }

  validateCourses(
    courses: CourseBuilderReport[] | null,
    input: CourseBuilderWorkerInput,
    started: number,
    options: { allowIncompleteCourse?: boolean } = {},
  ): CourseBuilderWorkerValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];
    const incompleteOk = options.allowIncompleteCourse === true;
    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) {
      errors.push("Course Builder Worker requires validated=true");
    }
    if (!courses || courses.length === 0) {
      if (decision !== "fail") {
        warnings.push("No courses were produced yet");
      }
    } else {
      for (const course of courses) {
        if (!course.courseId) errors.push("Missing course ID");
        if (!course.timestamp) errors.push("Missing timestamp");
        if (!course.productId) errors.push("Missing product ID");
        if (!course.courseTitle?.trim()) errors.push("Missing course title");
        if (!course.productType) errors.push("Missing product type");
        if (!course.targetAudience?.trim()) errors.push("Missing target audience");
        if (!incompleteOk && !course.moduleStructure.length) {
          errors.push("Missing module structure");
        }
        if (!incompleteOk && course.lessonCount == null) errors.push("Missing lesson count");
        if (!incompleteOk && !course.learningObjectives.length) {
          errors.push("Missing learning objectives");
        }
        if (!incompleteOk && !course.qualityReview?.trim()) {
          errors.push("Missing quality review");
        }
        if (!incompleteOk && !course.exportFormats.length) {
          errors.push("Missing export formats");
        }
        if (course.confidenceScore == null) errors.push("Missing confidence score");
        if (!course.metadataVersion) errors.push("Missing metadata version");
        if (!course.neverBuildSalesPages) {
          errors.push("Course Builder Worker must never build sales pages");
        }
        if (!course.neverProcessPayments) {
          errors.push("Course Builder Worker must never process payments");
        }
        if (!course.neverDeliverCoursesToCustomers) {
          errors.push("Course Builder Worker must never deliver courses to customers");
        }
        if (!course.neverPublishCoursesDirectly) {
          errors.push("Course Builder Worker must never publish courses directly");
        }
        if (!course.neverOverridePillow) {
          errors.push("Course Builder Worker must never override Pillow");
        }
        if (!course.neverOverrideGrandKing) {
          errors.push("Course Builder Worker must never override Grand King");
        }
        if (!course.neverImplementQ506OrLater) {
          errors.push("Course Builder Worker must never implement Q5-06 or later");
        }
        if (!course.followApprovedProductResearch) {
          errors.push("Course Builder Worker must follow approved product research");
        }
        if (!course.produceOriginalCourseMaterial) {
          errors.push("Course Builder Worker must produce original course material");
        }
        if (!course.moduleStructure.length) {
          warnings.push(`Course ${course.courseId} module structure not yet created`);
        }
        if (!course.lessons.length) {
          warnings.push(`Course ${course.courseId} has no lesson bodies yet`);
        }
        if (!course.quizzes.length) {
          warnings.push(`Course ${course.courseId} quizzes not yet generated`);
        }
        if (!course.resources.length) {
          warnings.push(`Course ${course.courseId} downloadable resources not yet generated`);
        }
        if (!course.learningObjectives.length) {
          warnings.push(`Course ${course.courseId} learning objectives not yet created`);
        }
        if (!course.qualityReview?.trim()) {
          warnings.push(`Course ${course.courseId} quality review not yet completed`);
        }
        if (!course.exportFormats.length) {
          warnings.push(`Course ${course.courseId} export formats not yet prepared`);
        }
        if (!course.instructionalFlowValidated) {
          warnings.push(`Course ${course.courseId} instructional flow not yet validated`);
        }
        if (!course.selfReviewPassed) {
          warnings.push(`Course ${course.courseId} self-review did not fully pass`);
        }
        if (course.researchCompliance === "non_compliant") {
          warnings.push(`Course ${course.courseId} research compliance is non_compliant`);
        }
      }
    }
    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  finalize(
    decision: CourseBuilderWorkerValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): CourseBuilderWorkerValidationReport {
    const finalDecision =
      errors.length || decision === "fail"
        ? "fail"
        : warnings.length || decision === "partial"
          ? "partial"
          : "pass";
    return {
      validationReportId: `cbw-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision: finalDecision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: CBW_METADATA_VERSION,
    };
  }

  hasBoundaryViolation(input: BoundaryInput) {
    return (
      input.buildSalesPages === true ||
      input.processPayments === true ||
      input.deliverCoursesToCustomers === true ||
      input.publishCoursesDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ506OrLater === true
    );
  }

  private pushBoundaryErrors(input: BoundaryInput, errors: string[]) {
    if (input.buildSalesPages) errors.push("Course Builder Worker must never build sales pages");
    if (input.processPayments) errors.push("Course Builder Worker must never process payments");
    if (input.deliverCoursesToCustomers) {
      errors.push("Course Builder Worker must never deliver courses to customers");
    }
    if (input.publishCoursesDirectly) {
      errors.push("Course Builder Worker must never publish courses directly");
    }
    if (input.overridePillow) errors.push("Course Builder Worker must never override Pillow");
    if (input.overrideGrandKing) {
      errors.push("Course Builder Worker must never override Grand King");
    }
    if (input.implementQ506OrLater) {
      errors.push("Course Builder Worker must never implement Q5-06 or later");
    }
  }
}

export class HealthMonitor {
  status(
    validationDecision: "pass" | "fail" | "partial" | null,
    enabled: boolean,
  ): "healthy" | "degraded" | "failed" | "standby" {
    if (!enabled) return "standby";
    if (validationDecision === "fail") return "failed";
    if (validationDecision === "partial") return "degraded";
    return "healthy";
  }
}

export class RecoveryManager {
  private failures = 0;

  recordFailure() {
    this.failures += 1;
    return this.failures;
  }

  reset() {
    this.failures = 0;
  }

  getFailureCount() {
    return this.failures;
  }
}
