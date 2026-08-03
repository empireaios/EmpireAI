import { STR_METADATA_VERSION } from "./paths.js";
import type {
  AlternativeRoute,
  CostAssessment,
  CostLevel,
  RiskAssessment,
  RiskLevel,
  RoutableTool,
  RoutableWorker,
  RoutingRecord,
  SkillToolRouterInput,
  ValidationStatus,
} from "./types.js";

const COST_RANK: Record<CostLevel, number> = { low: 1, medium: 2, high: 3 };

export type SuitabilityResult = {
  workers: Array<{ worker: RoutableWorker; score: number }>;
  tools: Array<{ tool: RoutableTool; score: number }>;
  risk: RiskAssessment;
  cost: CostAssessment;
  confidenceScore: number;
  multipleWorkersRequired: boolean;
  escalationRecommended: boolean;
  factorsApplied: string[];
  reason: string;
  alternatives: AlternativeRoute[];
};

/** Evaluates worker/tool suitability using extensible routing factors. */
export class SuitabilityEvaluator {
  evaluate(
    input: SkillToolRouterInput,
    requiredCapabilities: string[],
    candidateWorkers: RoutableWorker[],
    candidateTools: RoutableTool[],
    routingFactors: string[],
    thresholds: { escalationConfidenceThreshold: number; multiWorkerCapabilityThreshold: number },
  ): SuitabilityResult {
    const factorsApplied = [...routingFactors];
    const workerScores = candidateWorkers
      .map((worker) => ({
        worker,
        score: this.scoreWorker(worker, requiredCapabilities, input, factorsApplied),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    const preferredWorkers = (input.preferredWorkerIds ?? []).filter(Boolean);
    if (preferredWorkers.length) {
      workerScores.sort((a, b) => {
        const ap = preferredWorkers.includes(a.worker.workerId) ? 1 : 0;
        const bp = preferredWorkers.includes(b.worker.workerId) ? 1 : 0;
        return bp - ap || b.score - a.score;
      });
    }

    const multipleWorkersRequired =
      input.requireMultipleWorkers === true ||
      requiredCapabilities.length >= thresholds.multiWorkerCapabilityThreshold;

    const selectedWorkerEntries = multipleWorkersRequired
      ? workerScores.slice(0, Math.min(3, Math.max(2, workerScores.length)))
      : workerScores.slice(0, 1);

    const selectedWorkers = selectedWorkerEntries.map((e) => e.worker);
    const approvedToolNames = new Set(selectedWorkers.flatMap((w) => w.approvedTools));

    const toolScores = candidateTools
      .map((tool) => ({
        tool,
        score: this.scoreTool(tool, requiredCapabilities, approvedToolNames, input, factorsApplied),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    const preferredTools = (input.preferredToolIds ?? []).filter(Boolean);
    if (preferredTools.length) {
      toolScores.sort((a, b) => {
        const ap = preferredTools.includes(a.tool.toolName) || preferredTools.includes(a.tool.toolId) ? 1 : 0;
        const bp = preferredTools.includes(b.tool.toolName) || preferredTools.includes(b.tool.toolId) ? 1 : 0;
        return bp - ap || b.score - a.score;
      });
    }

    const selectedToolEntries = toolScores.slice(0, Math.min(3, Math.max(1, toolScores.length)));
    const risk = this.assessRisk(input, selectedWorkers, selectedToolEntries.map((t) => t.tool), requiredCapabilities);
    const cost = this.assessCost(input, selectedWorkers, selectedToolEntries.map((t) => t.tool));

    const baseConfidence =
      selectedWorkerEntries.length === 0
        ? 0
        : Math.round(
            (selectedWorkerEntries.reduce((sum, e) => sum + e.score, 0) / selectedWorkerEntries.length) * 0.7 +
              (selectedToolEntries.reduce((sum, e) => sum + e.score, 0) /
                Math.max(1, selectedToolEntries.length)) *
                0.3,
          );

    const confidenceScore = Math.max(0, Math.min(100, baseConfidence - (risk.escalate ? 15 : 0)));
    const escalationRecommended =
      risk.escalate || confidenceScore < thresholds.escalationConfidenceThreshold || selectedWorkers.length === 0;

    const alternatives = this.buildAlternatives(workerScores, toolScores, selectedWorkers);

    const reason =
      selectedWorkers.length === 0
        ? "No suitable workers matched required capabilities; escalation recommended"
        : `Routed to ${selectedWorkers.map((w) => w.workerName).join(", ")} with tools ${
            selectedToolEntries.map((t) => t.tool.toolName).join(", ") || "none"
          } based on capability, context, risk, and cost`;

    return {
      workers: selectedWorkerEntries,
      tools: selectedToolEntries,
      risk,
      cost,
      confidenceScore,
      multipleWorkersRequired,
      escalationRecommended,
      factorsApplied,
      reason,
      alternatives,
    };
  }

  buildRecord(
    input: SkillToolRouterInput,
    requiredCapabilities: string[],
    result: SuitabilityResult,
    validationStatus: ValidationStatus,
  ): RoutingRecord {
    routingSequence += 1;
    return {
      routingId: `str-rte-${Date.now()}-${routingSequence}`,
      timestamp: new Date().toISOString(),
      executiveRequest: input.executiveRequest.trim(),
      requiredCapabilities: [...requiredCapabilities],
      selectedWorkers: result.workers.map((w) => w.worker.workerId),
      selectedTools: result.tools.map((t) => t.tool.toolName),
      routingReason: result.reason,
      riskAssessment: { ...result.risk, factors: [...result.risk.factors] },
      costAssessment: { ...result.cost, factors: [...result.cost.factors] },
      confidenceScore: result.confidenceScore,
      alternativeRoutes: result.alternatives.map((alt) => ({
        ...alt,
        selectedWorkers: [...alt.selectedWorkers],
        selectedTools: [...alt.selectedTools],
      })),
      metadataVersion: STR_METADATA_VERSION,
      routingTraceId: `str-trace-${Date.now()}-${routingSequence}`,
      routingFactorsApplied: [...result.factorsApplied],
      multipleWorkersRequired: result.multipleWorkersRequired,
      escalationRecommended: result.escalationRecommended,
      validationStatus,
      neverExecuteWork: true,
      neverPerformOrchestration: true,
      neverReplaceWorkers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      workExecuted: false,
      orchestrationPerformed: false,
      workersReplaced: false,
      pillowOverridden: false,
      grandKingOverridden: false,
      preserveRoutingTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private scoreWorker(
    worker: RoutableWorker,
    required: string[],
    input: SkillToolRouterInput,
    factors: string[],
  ): number {
    let score = 0;
    const caps = required.map((c) => c.toLowerCase());
    const overlap = worker.capabilities.filter((c) =>
      caps.some((cap) => c.toLowerCase() === cap || c.toLowerCase().includes(cap)),
    ).length;
    if (overlap === 0) return 0;

    if (factors.includes("worker_capability")) score += Math.min(40, overlap * 18);
    if (factors.includes("worker_availability")) {
      score += worker.availability === "available" ? 15 : worker.availability === "busy" ? 5 : 0;
    }
    if (factors.includes("worker_performance")) score += Math.round(worker.performanceScore * 0.2);
    if (factors.includes("worker_authority")) score += Math.round(worker.authorityLevel * 0.1);
    if (factors.includes("security")) {
      score += worker.securityClearance === "restricted" ? 8 : worker.securityClearance === "elevated" ? 6 : 4;
    }
    if (factors.includes("cost")) {
      score += worker.costProfile === "low" ? 8 : worker.costProfile === "medium" ? 5 : 2;
    }
    if (factors.includes("business_context") && input.businessContext?.trim()) {
      const ctx = input.businessContext.toLowerCase();
      if (ctx.includes(worker.department.toLowerCase()) || ctx.includes(worker.workerName.toLowerCase())) {
        score += 10;
      }
    }
    if (factors.includes("risk") && input.riskHint === "critical" && worker.authorityLevel < 80) {
      score -= 10;
    }
    return Math.max(0, Math.min(100, score));
  }

  private scoreTool(
    tool: RoutableTool,
    required: string[],
    approvedToolNames: Set<string>,
    input: SkillToolRouterInput,
    factors: string[],
  ): number {
    let score = 0;
    const caps = required.map((c) => c.toLowerCase());
    const overlap = tool.compatibleCapabilities.filter((c) =>
      caps.some((cap) => c.toLowerCase() === cap || c.toLowerCase().includes(cap)),
    ).length;
    if (overlap === 0) return 0;

    if (factors.includes("tool_compatibility")) score += Math.min(40, overlap * 16);
    if (factors.includes("tool_availability")) {
      score += tool.availability === "available" ? 20 : tool.availability === "limited" ? 8 : 0;
    }
    if (approvedToolNames.has(tool.toolName)) score += 20;
    if (factors.includes("security")) {
      score += tool.securityRating === "restricted" ? 6 : tool.securityRating === "elevated" ? 8 : 10;
    }
    if (factors.includes("cost")) {
      score += tool.costProfile === "low" ? 10 : tool.costProfile === "medium" ? 6 : 2;
    }
    if (input.costCeiling && COST_RANK[tool.costProfile] > COST_RANK[input.costCeiling]) {
      score -= 15;
    }
    return Math.max(0, Math.min(100, score));
  }

  private assessRisk(
    input: SkillToolRouterInput,
    workers: RoutableWorker[],
    tools: RoutableTool[],
    required: string[],
  ): RiskAssessment {
    const factors: string[] = [];
    let score = 20;
    if (input.riskHint) {
      factors.push(`risk_hint:${input.riskHint}`);
      score += input.riskHint === "critical" ? 50 : input.riskHint === "high" ? 35 : input.riskHint === "medium" ? 20 : 5;
    }
    if (required.some((c) => c.includes("threat") || c.includes("policy") || c.includes("risk"))) {
      factors.push("sensitive_capability");
      score += 20;
    }
    if (workers.some((w) => w.securityClearance === "restricted")) {
      factors.push("restricted_worker_clearance");
      score += 10;
    }
    if (tools.some((t) => t.securityRating === "restricted")) {
      factors.push("restricted_tool");
      score += 10;
    }
    if (workers.length === 0) {
      factors.push("no_worker_match");
      score += 40;
    }
    const level: RiskLevel =
      score >= 80 ? "critical" : score >= 55 ? "high" : score >= 35 ? "medium" : "low";
    return { level, score: Math.min(100, score), factors, escalate: level === "high" || level === "critical" };
  }

  private assessCost(
    input: SkillToolRouterInput,
    workers: RoutableWorker[],
    tools: RoutableTool[],
  ): CostAssessment {
    const profiles = [...workers.map((w) => w.costProfile), ...tools.map((t) => t.costProfile)];
    const maxRank = profiles.reduce((max, p) => Math.max(max, COST_RANK[p]), 1);
    const level: CostLevel = maxRank >= 3 ? "high" : maxRank >= 2 ? "medium" : "low";
    const factors = [
      `worker_cost_max=${workers.map((w) => w.costProfile).join("|") || "none"}`,
      `tool_cost_max=${tools.map((t) => t.costProfile).join("|") || "none"}`,
    ];
    const withinCeiling = !input.costCeiling || COST_RANK[level] <= COST_RANK[input.costCeiling];
    if (!withinCeiling) factors.push("exceeds_cost_ceiling");
    return { level, score: maxRank * 30, factors, withinCeiling };
  }

  private buildAlternatives(
    workerScores: Array<{ worker: RoutableWorker; score: number }>,
    toolScores: Array<{ tool: RoutableTool; score: number }>,
    selectedWorkers: RoutableWorker[],
  ): AlternativeRoute[] {
    const selectedIds = new Set(selectedWorkers.map((w) => w.workerId));
    const alternatives: AlternativeRoute[] = [];
    const unusedWorkers = workerScores.filter((w) => !selectedIds.has(w.worker.workerId)).slice(0, 2);
    for (const [index, entry] of unusedWorkers.entries()) {
      const tools = toolScores
        .filter((t) => entry.worker.approvedTools.includes(t.tool.toolName))
        .slice(0, 2)
        .map((t) => t.tool.toolName);
      alternatives.push({
        routeId: `str-alt-${index + 1}`,
        selectedWorkers: [entry.worker.workerId],
        selectedTools: tools.length ? tools : entry.worker.approvedTools.slice(0, 1),
        confidenceScore: Math.max(0, Math.min(100, Math.round(entry.score * 0.85))),
        reason: `Alternative route via ${entry.worker.workerName}`,
      });
    }
    return alternatives;
  }
}

let routingSequence = 0;

export function resetRoutingSequenceForTesting() {
  routingSequence = 0;
}
