import type { CourseBuilderReport } from "./types.js";

/** Authoritative in-memory course store — creation/export-ready assets only. */
export class CourseStore {
  private courses = new Map<string, CourseBuilderReport>();
  private latestCourseId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    courseId: string;
    action: string;
    details: string;
  }> = [];

  seed(courses: CourseBuilderReport[]) {
    this.courses.clear();
    this.latestCourseId = null;
    this.auditTrail = [];
    for (const course of courses) {
      this.courses.set(course.courseId, clone(course));
      this.latestCourseId = course.courseId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        courseId: course.courseId,
        action: "seed",
        details: `seeded course=${course.courseId} title=${course.courseTitle} type=${course.productType}`,
      });
    }
  }

  count() {
    return this.courses.size;
  }

  list() {
    return [...this.courses.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(courseId: string) {
    const course = this.courses.get(courseId);
    return course ? clone(course) : null;
  }

  getLatestCourseId() {
    return this.latestCourseId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(course: CourseBuilderReport, action = "save") {
    this.courses.set(course.courseId, clone(course));
    this.latestCourseId = course.courseId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      courseId: course.courseId,
      action,
      details: `title=${course.courseTitle} type=${course.productType} lessons=${course.lessonCount} confidence=${course.confidenceScore}`,
    });
    return clone(course);
  }

  markSubmitted(courseId: string, executiveReportId: string) {
    const current = this.courses.get(courseId);
    if (!current) return null;
    const updated: CourseBuilderReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(course: CourseBuilderReport): CourseBuilderReport {
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
  };
}
