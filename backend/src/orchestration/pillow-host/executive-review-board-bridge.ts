import {
  assembleExecutiveReviewBoard,
  buildFallbackExecutiveReviewBoard,
  getReviewConfiguration,
  getReviewAuditHistory,
} from "@empireai/pillow";
import type {
  ExecutiveReviewBoard,
  ExecutiveReviewRecord,
  ReviewBoardConfiguration,
} from "@empireai/pillow";

/** Fallback Executive Review Board when Pillow session is unavailable. */
export function collectExecutiveReviewBoardSnapshot() {
  const engine = buildFallbackExecutiveReviewBoard();
  return {
    computedAt: new Date().toISOString(),
    missionId: "E5-10",
    live: false,
    executiveReviewBoard: engine,
  };
}

export function getExecutiveReviewCalendar(): {
  computedAt: string;
  calendar: ExecutiveReviewBoard["reviewCalendar"];
  currentReviews: ExecutiveReviewBoard["currentReviews"];
} {
  const engine = buildFallbackExecutiveReviewBoard();
  return {
    computedAt: new Date().toISOString(),
    calendar: engine.reviewCalendar,
    currentReviews: engine.currentReviews,
  };
}

export function getExecutiveReviewReport() {
  const engine = buildFallbackExecutiveReviewBoard();
  return {
    computedAt: new Date().toISOString(),
    report: engine.executiveReport,
    metrics: engine.metrics,
    monitoring: engine.monitoringStatus,
  };
}

export function getExecutiveReviewRegister(): {
  computedAt: string;
  register: ExecutiveReviewRecord[];
  findings: ExecutiveReviewBoard["executiveFindings"];
  assignedActions: ExecutiveReviewBoard["assignedActions"];
} {
  const engine = buildFallbackExecutiveReviewBoard();
  return {
    computedAt: new Date().toISOString(),
    register: engine.executiveReviewRegister,
    findings: engine.executiveFindings,
    assignedActions: engine.assignedActions,
  };
}

export function getExecutiveReviewHistory(): {
  computedAt: string;
  auditHistory: ReturnType<typeof getReviewAuditHistory>;
  configuration: ReviewBoardConfiguration;
} {
  return {
    computedAt: new Date().toISOString(),
    auditHistory: getReviewAuditHistory(100),
    configuration: getReviewConfiguration(),
  };
}

export function getExecutiveReviewHealth() {
  const engine = buildFallbackExecutiveReviewBoard();
  return {
    computedAt: new Date().toISOString(),
    health: engine.healthStatus,
    metrics: engine.metrics,
    engineHealth: engine.engineHealth,
    reviewHealth: engine.reviewHealth,
  };
}

export { assembleExecutiveReviewBoard, buildFallbackExecutiveReviewBoard };
