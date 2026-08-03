import { CORE_METADATA_VERSION } from "./paths.js";
import type {
  ChallengeRaised,
  CollectiveReasoningEngineInput,
  IndependentOpinion,
  MinorityOpinion,
  ReasoningParticipant,
  ReasoningRecord,
  ValidationStatus,
} from "./types.js";

export type ReasoningSessionResult = {
  opinions: IndependentOpinion[];
  challenges: ChallengeRaised[];
  supportingEvidence: string[];
  consensusPosition: string;
  minorityOpinions: MinorityOpinion[];
  confidenceScore: number;
  recommendedAction: string;
  conflictsDetected: number;
  debateSummary: string;
  modesApplied: string[];
};

/** Coordinates independent analysis, debate, challenge, consensus, and minority report. */
export class DebateCoordinator {
  run(
    input: CollectiveReasoningEngineInput,
    participants: ReasoningParticipant[],
    requiredExpertise: string[],
    supportedModes: string[],
    consensusThreshold: number,
  ): ReasoningSessionResult {
    const modesApplied = resolveModes(input.reasoningModes, supportedModes);
    const opinions = modesApplied.includes("independent_analysis")
      ? this.collectOpinions(input, participants, requiredExpertise)
      : [];

    const conflicts = this.detectConflicts(opinions);
    const challenges =
      modesApplied.includes("peer_challenge") || modesApplied.includes("structured_debate")
        ? this.raiseChallenges(opinions, participants, conflicts)
        : [];

    const debateSummary = modesApplied.includes("structured_debate")
      ? this.summarizeDebate(opinions, challenges, conflicts)
      : "Debate mode not applied; independent opinions retained.";

    const { consensusPosition, minorityOpinions, confidenceScore } = modesApplied.includes(
      "consensus_building",
    )
      ? this.buildConsensus(opinions, participants, consensusThreshold)
      : {
          consensusPosition: opinions[0]?.position ?? "No consensus formed",
          minorityOpinions: [] as MinorityOpinion[],
          confidenceScore: opinions[0]?.confidence ?? 0,
        };

    const minority =
      modesApplied.includes("minority_report") && minorityOpinions.length === 0 && conflicts > 0
        ? this.forceMinorityFromConflicts(opinions)
        : minorityOpinions;

    const supportingEvidence = [
      ...new Set(opinions.flatMap((o) => o.evidence)),
      ...challenges.map((c) => `challenge:${c.challengerId}->${c.targetWorkerId}:${c.assumption}`),
    ];

    const recommendedAction = this.recommend(input, consensusPosition, confidenceScore, conflicts, minority.length);

    return {
      opinions,
      challenges,
      supportingEvidence,
      consensusPosition,
      minorityOpinions: minority,
      confidenceScore,
      recommendedAction,
      conflictsDetected: conflicts,
      debateSummary,
      modesApplied,
    };
  }

  buildRecord(
    input: CollectiveReasoningEngineInput,
    participants: ReasoningParticipant[],
    requiredExpertise: string[],
    result: ReasoningSessionResult,
    validationStatus: ValidationStatus,
  ): ReasoningRecord {
    reasoningSequence += 1;
    return {
      reasoningId: `core-rsn-${Date.now()}-${reasoningSequence}`,
      timestamp: new Date().toISOString(),
      executiveQuestion: input.executiveQuestion.trim(),
      participants: participants.map((p) => p.workerId),
      independentOpinions: result.opinions.map((o) => ({
        ...o,
        assumptions: [...o.assumptions],
        evidence: [...o.evidence],
      })),
      challengesRaised: result.challenges.map((c) => ({ ...c })),
      supportingEvidence: [...result.supportingEvidence],
      consensusPosition: result.consensusPosition,
      minorityOpinions: result.minorityOpinions.map((m) => ({ ...m })),
      confidenceScore: result.confidenceScore,
      recommendedAction: result.recommendedAction,
      metadataVersion: CORE_METADATA_VERSION,
      reasoningTraceId: `core-trace-${Date.now()}-${reasoningSequence}`,
      modesApplied: [...result.modesApplied],
      requiredExpertise: [...requiredExpertise],
      conflictsDetected: result.conflictsDetected,
      debateSummary: result.debateSummary,
      validationStatus,
      neverExecuteWork: true,
      neverAssignWorkersPermanently: true,
      neverReplacePillow: true,
      neverOverrideGrandKing: true,
      neverApproveActions: true,
      workExecuted: false,
      workersAssignedPermanently: false,
      pillowReplaced: false,
      grandKingOverridden: false,
      actionsApproved: false,
      preserveReasoningTraceability: true,
      preserveAuditability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  private collectOpinions(
    input: CollectiveReasoningEngineInput,
    participants: ReasoningParticipant[],
    requiredExpertise: string[],
  ): IndependentOpinion[] {
    const question = input.executiveQuestion.trim();
    return participants.map((participant, index) => {
      const lean =
        participant.stanceBias === "challenging"
          ? "Caution-first"
          : participant.stanceBias === "supportive"
            ? "Proceed-with-controls"
            : "Balanced-conditional";
      const position =
        participant.stanceBias === "challenging"
          ? `${lean}: defer full commitment until ${participant.expertise[0] ?? "domain"} risks are mitigated for "${truncate(question, 80)}"`
          : participant.stanceBias === "supportive"
            ? `${lean}: advance the proposal with ${participant.expertise[0] ?? "domain"} oversight for "${truncate(question, 80)}"`
            : `${lean}: support a phased approach guided by ${participant.expertise.slice(0, 2).join("/")} for "${truncate(question, 80)}"`;

      return {
        workerId: participant.workerId,
        workerName: participant.workerName,
        position,
        confidence: Math.max(
          45,
          Math.min(95, Math.round(participant.authorityWeight * 0.7 + 20 - index * 2)),
        ),
        assumptions: [
          `expertise=${participant.expertise.join("|")}`,
          `required=${requiredExpertise.join("|")}`,
          `stance=${participant.stanceBias}`,
        ],
        evidence: [
          `${participant.workerName} evaluated ${requiredExpertise.join(", ") || "general"} dimensions`,
          `Authority weight ${participant.authorityWeight}`,
        ],
      };
    });
  }

  private detectConflicts(opinions: IndependentOpinion[]): number {
    if (opinions.length < 2) return 0;
    const buckets = {
      caution: opinions.filter((o) => o.position.toLowerCase().includes("caution") || o.position.toLowerCase().includes("defer")).length,
      proceed: opinions.filter((o) => o.position.toLowerCase().includes("advance") || o.position.toLowerCase().includes("proceed")).length,
      balanced: opinions.filter((o) => o.position.toLowerCase().includes("phased") || o.position.toLowerCase().includes("balanced")).length,
    };
    const active = [buckets.caution, buckets.proceed, buckets.balanced].filter((n) => n > 0).length;
    return active > 1 ? active : 0;
  }

  private raiseChallenges(
    opinions: IndependentOpinion[],
    participants: ReasoningParticipant[],
    conflicts: number,
  ): ChallengeRaised[] {
    if (conflicts === 0 && opinions.length < 2) return [];
    const challengers = participants.filter((p) => p.stanceBias === "challenging");
    const targets = opinions.filter((o) => o.position.toLowerCase().includes("advance"));
    const challenges: ChallengeRaised[] = [];

    for (const challenger of challengers.slice(0, 2)) {
      const target = targets[0] ?? opinions.find((o) => o.workerId !== challenger.workerId);
      if (!target) continue;
      challenges.push({
        challengerId: challenger.workerId,
        targetWorkerId: target.workerId,
        assumption: target.assumptions[0] ?? "unspecified assumption",
        challenge: `${challenger.workerName} challenges assumption that execution readiness is sufficient without additional ${challenger.expertise[0] ?? "controls"} review`,
        severity: challenger.authorityWeight >= 85 ? "high" : "medium",
      });
    }

    if (challenges.length === 0 && opinions.length >= 2) {
      challenges.push({
        challengerId: opinions[1]!.workerId,
        targetWorkerId: opinions[0]!.workerId,
        assumption: opinions[0]!.assumptions[0] ?? "primary assumption",
        challenge: `${opinions[1]!.workerName} requests clarification of assumptions before consensus`,
        severity: "low",
      });
    }

    return challenges;
  }

  private summarizeDebate(
    opinions: IndependentOpinion[],
    challenges: ChallengeRaised[],
    conflicts: number,
  ): string {
    return `Structured debate across ${opinions.length} participants detected ${conflicts} conflict cluster(s) and raised ${challenges.length} challenge(s); positions refined toward a controlled recommendation.`;
  }

  private buildConsensus(
    opinions: IndependentOpinion[],
    participants: ReasoningParticipant[],
    threshold: number,
  ): { consensusPosition: string; minorityOpinions: MinorityOpinion[]; confidenceScore: number } {
    if (opinions.length === 0) {
      return {
        consensusPosition: "Insufficient opinions for consensus",
        minorityOpinions: [],
        confidenceScore: 0,
      };
    }

    const weightById = new Map(participants.map((p) => [p.workerId, p.authorityWeight]));
    const groups = {
      caution: opinions.filter((o) => /caution|defer/i.test(o.position)),
      proceed: opinions.filter((o) => /advance|proceed/i.test(o.position)),
      balanced: opinions.filter((o) => /phased|balanced|conditional/i.test(o.position)),
    };

    const score = (group: IndependentOpinion[]) =>
      group.reduce((sum, o) => sum + o.confidence * ((weightById.get(o.workerId) ?? 50) / 100), 0);

    const ranked = (
      [
        ["balanced", groups.balanced],
        ["proceed", groups.proceed],
        ["caution", groups.caution],
      ] as const
    )
      .map(([key, group]) => ({ key, group, score: score(group) }))
      .sort((a, b) => b.score - a.score);

    const winner = ranked[0]!;
    const total = ranked.reduce((sum, r) => sum + r.score, 0) || 1;
    const ratio = winner.score / total;
    const consensusReached = ratio >= threshold;

    const consensusPosition = consensusReached
      ? winner.key === "caution"
        ? "Consensus: delay commitment until key controls and risks are addressed"
        : winner.key === "proceed"
          ? "Consensus: proceed with the proposal under explicit oversight controls"
          : "Consensus: adopt a phased approach with measurable checkpoints"
      : "Partial consensus: no majority threshold reached; retain balanced phased recommendation";

    const minoritySource = ranked.slice(1).flatMap((r) => r.group);
    const minorityOpinions: MinorityOpinion[] = minoritySource.slice(0, 3).map((o) => ({
      workerId: o.workerId,
      workerName: o.workerName,
      position: o.position,
      rationale: `Preserved minority stance after consensus weighting (ratio=${ratio.toFixed(2)})`,
    }));

    const confidenceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (winner.group.reduce((s, o) => s + o.confidence, 0) / Math.max(1, winner.group.length)) *
            (consensusReached ? 1 : 0.85),
        ),
      ),
    );

    return { consensusPosition, minorityOpinions, confidenceScore };
  }

  private forceMinorityFromConflicts(opinions: IndependentOpinion[]): MinorityOpinion[] {
    return opinions
      .filter((o) => /caution|defer/i.test(o.position))
      .slice(0, 2)
      .map((o) => ({
        workerId: o.workerId,
        workerName: o.workerName,
        position: o.position,
        rationale: "Recorded as minority report due to unresolved conflict clusters",
      }));
  }

  private recommend(
    input: CollectiveReasoningEngineInput,
    consensusPosition: string,
    confidenceScore: number,
    conflicts: number,
    minorityCount: number,
  ): string {
    const topic = truncate(input.executiveQuestion.trim(), 100);
    if (confidenceScore < 50 || conflicts >= 3) {
      return `Escalate "${topic}" for executive review; collective confidence ${confidenceScore} with ${minorityCount} minority opinion(s).`;
    }
    if (consensusPosition.toLowerCase().includes("delay")) {
      return `Hold decision on "${topic}" pending control remediation; revisit after challenge closure.`;
    }
    if (consensusPosition.toLowerCase().includes("phased") || consensusPosition.toLowerCase().includes("partial")) {
      return `Adopt a phased executive plan for "${topic}" with checkpoints addressing raised challenges.`;
    }
    return `Proceed on "${topic}" with oversight controls reflecting consensus and preserved minority opinions.`;
  }
}

let reasoningSequence = 0;

export function resetReasoningSequenceForTesting() {
  reasoningSequence = 0;
}

function resolveModes(
  requested: Array<string> | undefined,
  supported: string[],
): string[] {
  const defaults = [
    "independent_analysis",
    "structured_debate",
    "peer_challenge",
    "consensus_building",
    "minority_report",
  ];
  const selected = (requested?.length ? requested : defaults)
    .map((m) => m.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter((m) => supported.includes(m) || defaults.includes(m));
  return selected.length ? [...new Set(selected)] : defaults.filter((m) => supported.includes(m));
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
