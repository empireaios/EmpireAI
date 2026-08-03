import { DMEM_METADATA_VERSION } from "./paths.js";
import type {
  AlternativeOption,
  ApprovalStatus,
  DecisionMemoryInput,
  DecisionRecord,
  FinalOutcome,
  RiskAssessment,
  ValidationStatus,
} from "./types.js";

/** Authoritative in-memory Decision Memory store — record/retrieve only. */
export class DecisionMemoryStore {
  private records = new Map<string, DecisionRecord>();

  seed(records: DecisionRecord[]) {
    this.records.clear();
    for (const record of records) {
      this.records.set(record.decisionId, clone(record));
    }
  }

  count() {
    return this.records.size;
  }

  list() {
    return [...this.records.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(decisionId: string) {
    const record = this.records.get(decisionId);
    return record ? clone(record) : null;
  }

  record(input: DecisionMemoryInput, validationStatus: ValidationStatus): DecisionRecord {
    decisionSequence += 1;
    const decisionId = input.decisionId?.trim() || `dmem-dec-${Date.now()}-${decisionSequence}`;
    const existing = this.records.get(decisionId);
    const record: DecisionRecord = {
      decisionId,
      timestamp: existing?.timestamp ?? new Date().toISOString(),
      executiveObjective: input.executiveObjective?.trim() || existing?.executiveObjective || "",
      businessId: input.businessId?.trim() || existing?.businessId || "biz-unspecified",
      missionId: input.missionId?.trim() || existing?.missionId || "mission-unspecified",
      decisionSummary: input.decisionSummary?.trim() || existing?.decisionSummary || input.executiveObjective?.trim() || "",
      recommendedOption: input.recommendedOption?.trim() || existing?.recommendedOption || "",
      alternativeOptions: normalizeAlternatives(input.alternativeOptions ?? existing?.alternativeOptions ?? []),
      decisionRationale: input.decisionRationale?.trim() || existing?.decisionRationale || "",
      supportingEvidence: unique(input.supportingEvidence ?? existing?.supportingEvidence ?? []),
      assumptions: unique(input.assumptions ?? existing?.assumptions ?? []),
      riskAssessment: buildRisk(input, existing?.riskAssessment),
      confidenceScore: clampConfidence(input.confidenceScore ?? existing?.confidenceScore),
      approvalStatus: normalizeApproval(input.approvalStatus ?? existing?.approvalStatus ?? "pending"),
      finalOutcome: normalizeOutcome(input.finalOutcome ?? existing?.finalOutcome ?? "pending"),
      relatedWorkers: unique(input.relatedWorkers ?? existing?.relatedWorkers ?? []),
      metadataVersion: DMEM_METADATA_VERSION,
      decisionTraceId: existing?.decisionTraceId ?? `dmem-trace-${Date.now()}-${decisionSequence}`,
      validationStatus,
      neverMakeDecisions: true,
      neverExecuteWork: true,
      neverReplaceExecutionMemory: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      decisionsMade: false,
      workExecuted: false,
      executionMemoryReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveDecisionTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    this.records.set(decisionId, clone(record));
    return clone(record);
  }

  updateOutcome(
    decisionId: string,
    finalOutcome: FinalOutcome | string,
    validationStatus: ValidationStatus,
  ): DecisionRecord | null {
    const existing = this.records.get(decisionId);
    if (!existing) return null;
    const updated: DecisionRecord = {
      ...clone(existing),
      finalOutcome: normalizeOutcome(finalOutcome),
      validationStatus,
      timestamp: new Date().toISOString(),
    };
    this.records.set(decisionId, updated);
    return clone(updated);
  }

  search(input: DecisionMemoryInput): DecisionRecord[] {
    const dimension = (input.dimension ?? "").toString().trim().toLowerCase().replace(/\s+/g, "_");
    const query = (input.query ?? "").toString().trim().toLowerCase();
    let results = this.list();

    if (dimension === "decision_id" && query) {
      results = results.filter((r) => r.decisionId.toLowerCase() === query || r.decisionId.toLowerCase().includes(query));
    } else if (dimension === "business") {
      const business = (input.businessId ?? query).toLowerCase();
      results = results.filter((r) => r.businessId.toLowerCase() === business || r.businessId.toLowerCase().includes(business));
    } else if (dimension === "mission") {
      const mission = (input.missionId ?? query).toLowerCase();
      results = results.filter((r) => r.missionId.toLowerCase() === mission || r.missionId.toLowerCase().includes(mission));
    } else if (dimension === "worker") {
      results = results.filter((r) =>
        r.relatedWorkers.some((w) => w.toLowerCase() === query || w.toLowerCase().includes(query)),
      );
    } else if (dimension === "outcome") {
      const outcome = (input.finalOutcome ?? query).toString().toLowerCase();
      results = results.filter((r) => r.finalOutcome.toLowerCase() === outcome);
    } else if (dimension === "approval_status") {
      const status = (input.approvalStatus ?? query).toString().toLowerCase();
      results = results.filter((r) => r.approvalStatus.toLowerCase() === status);
    } else if (dimension === "confidence") {
      const min = input.minConfidence ?? (query ? Number.parseFloat(query) : 0);
      const max = input.maxConfidence ?? 100;
      results = results.filter((r) => r.confidenceScore >= (Number.isFinite(min) ? min : 0) && r.confidenceScore <= max);
    } else if (dimension === "date") {
      const from = input.dateFrom ? Date.parse(input.dateFrom) : Number.NEGATIVE_INFINITY;
      const to = input.dateTo ? Date.parse(input.dateTo) : Number.POSITIVE_INFINITY;
      results = results.filter((r) => {
        const ts = Date.parse(r.timestamp);
        return Number.isFinite(ts) && ts >= from && ts <= to;
      });
    } else if (query) {
      results = results.filter((r) =>
        [
          r.decisionId,
          r.businessId,
          r.missionId,
          r.decisionSummary,
          r.recommendedOption,
          r.decisionRationale,
          ...r.relatedWorkers,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    if (input.businessId && dimension !== "business") {
      results = results.filter((r) => r.businessId === input.businessId);
    }
    if (input.missionId && dimension !== "mission") {
      results = results.filter((r) => r.missionId === input.missionId);
    }
    if (input.minConfidence != null) {
      results = results.filter((r) => r.confidenceScore >= input.minConfidence!);
    }
    if (input.maxConfidence != null) {
      results = results.filter((r) => r.confidenceScore <= input.maxConfidence!);
    }

    return results.map(clone);
  }

  compare(decisionIds: string[]) {
    const selected = decisionIds
      .map((id) => this.get(id))
      .filter((r): r is DecisionRecord => Boolean(r));
    const comparisons: Array<{
      leftDecisionId: string;
      rightDecisionId: string;
      sharedAssumptions: string[];
      differingOptions: string[];
      confidenceDelta: number;
      outcomeDelta: string;
    }> = [];

    for (let i = 0; i < selected.length; i += 1) {
      for (let j = i + 1; j < selected.length; j += 1) {
        const left = selected[i]!;
        const right = selected[j]!;
        const sharedAssumptions = left.assumptions.filter((a) =>
          right.assumptions.some((b) => b.toLowerCase() === a.toLowerCase()),
        );
        const differingOptions = [
          ...(left.recommendedOption !== right.recommendedOption
            ? [`recommended:${left.recommendedOption}!=${right.recommendedOption}`]
            : []),
          ...left.alternativeOptions
            .map((o) => o.summary)
            .filter((s) => !right.alternativeOptions.some((o) => o.summary === s))
            .map((s) => `left_only:${s}`),
          ...right.alternativeOptions
            .map((o) => o.summary)
            .filter((s) => !left.alternativeOptions.some((o) => o.summary === s))
            .map((s) => `right_only:${s}`),
        ];
        comparisons.push({
          leftDecisionId: left.decisionId,
          rightDecisionId: right.decisionId,
          sharedAssumptions,
          differingOptions,
          confidenceDelta: left.confidenceScore - right.confidenceScore,
          outcomeDelta: `${left.finalOutcome}->${right.finalOutcome}`,
        });
      }
    }
    return { records: selected, comparisons };
  }
}

let decisionSequence = 0;

export function resetDecisionSequenceForTesting() {
  decisionSequence = 0;
}

function clone(record: DecisionRecord): DecisionRecord {
  return {
    ...record,
    alternativeOptions: record.alternativeOptions.map((o) => ({ ...o })),
    supportingEvidence: [...record.supportingEvidence],
    assumptions: [...record.assumptions],
    relatedWorkers: [...record.relatedWorkers],
    riskAssessment: {
      ...record.riskAssessment,
      factors: [...record.riskAssessment.factors],
    },
  };
}

function unique(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function clampConfidence(value: number | undefined | null) {
  if (value == null || !Number.isFinite(value)) return 70;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeAlternatives(options: AlternativeOption[]): AlternativeOption[] {
  return options.map((option, index) => ({
    optionId: option.optionId?.trim() || `opt-${index + 1}`,
    summary: option.summary?.trim() || `Alternative ${index + 1}`,
    rejectedReason: option.rejectedReason ?? null,
  }));
}

function buildRisk(input: DecisionMemoryInput, existing?: RiskAssessment): RiskAssessment {
  return {
    level: input.riskLevel ?? existing?.level ?? "medium",
    summary: input.riskSummary?.trim() || existing?.summary || "Risk recorded for executive decision memory",
    factors: unique(input.riskFactors ?? existing?.factors ?? []),
  };
}

function normalizeApproval(value: ApprovalStatus | string): ApprovalStatus {
  const normalized = value.toString().trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized === "granted") return "approved";
  if (
    normalized === "pending" ||
    normalized === "approved" ||
    normalized === "rejected" ||
    normalized === "not_required" ||
    normalized === "escalated"
  ) {
    return normalized;
  }
  return "pending";
}

function normalizeOutcome(value: FinalOutcome | string): FinalOutcome {
  const normalized = value.toString().trim().toLowerCase().replace(/\s+/g, "_");
  if (
    normalized === "pending" ||
    normalized === "success" ||
    normalized === "partial_success" ||
    normalized === "failure" ||
    normalized === "reversed" ||
    normalized === "superseded"
  ) {
    return normalized;
  }
  return "pending";
}
