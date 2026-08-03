import { ERT_METADATA_VERSION } from "./paths.js";
import type {
  CompletionStatus,
  EntityType,
  ExecutiveReportingRuntimeInput,
  ExecutiveSummary,
  ReportRecord,
  ReportType,
  ReportingFrequency,
} from "./types.js";

export type NormalizedReport = {
  reportingEntity: string;
  entityType: EntityType | string;
  businessId: string;
  missionId: string;
  currentStatus: string;
  progress: number;
  blockers: string[];
  risks: string[];
  evidence: string[];
  nextAction: string;
  completionStatus: CompletionStatus;
  reportType: ReportType | string;
  reportingFrequency: ReportingFrequency | string;
};

/** Pure reporting normalization and aggregation helpers for Q0-26. */
export class ReportAggregator {
  normalize(
    input: ExecutiveReportingRuntimeInput,
    forcedEntityType?: EntityType | string | null,
    forcedReportType?: ReportType | string | null,
  ): NormalizedReport {
    const entityType =
      forcedEntityType?.toString().trim() ||
      input.entityType?.toString().trim() ||
      "worker";
    const reportType =
      forcedReportType?.toString().trim() ||
      input.reportType?.toString().trim() ||
      defaultReportType(entityType);
    const completionStatus = normalizeCompletion(input.completionStatus) ??
      (input.blockers?.length ? "blocked" : "in_progress");
    const progress =
      input.progress != null && Number.isFinite(input.progress)
        ? Math.max(0, Math.min(100, Number(input.progress)))
        : completionStatus === "completed"
          ? 100
          : completionStatus === "not_started"
            ? 0
            : 50;

    return {
      reportingEntity:
        input.reportingEntity?.trim() ||
        defaultEntityName(entityType),
      entityType,
      businessId: input.businessId?.trim() || "biz-unspecified",
      missionId: input.missionId?.trim() || "mission-unspecified",
      currentStatus:
        input.currentStatus?.trim() ||
        (completionStatus === "blocked" ? "blocked" : completionStatus),
      progress,
      blockers: unique(input.blockers ?? []),
      risks: unique(input.risks ?? []),
      evidence: unique(input.evidence ?? []),
      nextAction:
        input.nextAction?.trim() ||
        (completionStatus === "completed"
          ? "Await executive acknowledgment"
          : "Continue assigned work and report progress"),
      completionStatus,
      reportType,
      reportingFrequency:
        input.reportingFrequency?.toString().trim() || "event_driven",
    };
  }

  aggregateProgress(records: ReportRecord[]): number {
    if (!records.length) return 0;
    const sum = records.reduce((acc, r) => acc + r.progress, 0);
    return Math.round((sum / records.length) * 100) / 100;
  }

  collectBlockers(records: ReportRecord[]): string[] {
    return unique(records.flatMap((r) => r.blockers));
  }

  collectRisks(records: ReportRecord[]): string[] {
    return unique(records.flatMap((r) => r.risks));
  }

  buildSummary(records: ReportRecord[]): ExecutiveSummary {
    const businessId = records[0]?.businessId ?? "biz-unspecified";
    const missionIds = unique(records.map((r) => r.missionId));
    const completionBreakdown: Record<string, number> = {};
    const entityBreakdown: Record<string, number> = {};
    for (const record of records) {
      completionBreakdown[record.completionStatus] =
        (completionBreakdown[record.completionStatus] ?? 0) + 1;
      entityBreakdown[record.entityType.toString()] =
        (entityBreakdown[record.entityType.toString()] ?? 0) + 1;
    }
    const openBlockers = this.collectBlockers(records);
    const openRisks = this.collectRisks(records);
    const averageProgress = this.aggregateProgress(records);
    const narrative = [
      `Executive visibility across ${records.length} report(s).`,
      `Average progress ${averageProgress}%.`,
      openBlockers.length
        ? `${openBlockers.length} open blocker(s): ${openBlockers.slice(0, 3).join("; ")}.`
        : "No open blockers.",
      openRisks.length
        ? `${openRisks.length} open risk(s).`
        : "No open risks.",
    ].join(" ");

    return {
      summaryId: `ert-sum-${Date.now()}`,
      timestamp: new Date().toISOString(),
      businessId,
      missionId: missionIds.length === 1 ? missionIds[0]! : null,
      averageProgress,
      totalReports: records.length,
      openBlockers,
      openRisks,
      completionBreakdown,
      entityBreakdown,
      narrative,
      metadataVersion: ERT_METADATA_VERSION,
    };
  }
}

function defaultEntityName(entityType: string) {
  switch (entityType) {
    case "department":
      return "department-unspecified";
    case "factory":
      return "factory-unspecified";
    case "executive_component":
      return "executive-unspecified";
    default:
      return "worker-unspecified";
  }
}

function defaultReportType(entityType: string): ReportType {
  switch (entityType) {
    case "department":
      return "department_summary";
    case "factory":
      return "factory_summary";
    case "executive_component":
      return "executive_summary";
    default:
      return "progress_report";
  }
}

function normalizeCompletion(
  value: string | null | undefined,
): CompletionStatus | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (
    normalized === "not_started" ||
    normalized === "in_progress" ||
    normalized === "blocked" ||
    normalized === "completed" ||
    normalized === "failed"
  ) {
    return normalized;
  }
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
