import type { TaskNegotiationProtocolConfiguration } from "./configuration.js";
import type {
  DependencyEdge,
  EscalationStatus,
  NegotiationOutcome,
  OwnershipDecision,
  TaskHandoff,
  TaskNegotiationProtocolInput,
  WorkerCapabilityDeclaration,
} from "./types.js";

export type NegotiationBundle = {
  candidates: WorkerCapabilityDeclaration[];
  ownership: OwnershipDecision;
  supportingWorkers: string[];
  dependencyGraph: DependencyEdge[];
  handoffs: TaskHandoff[];
  conflicts: string[];
  result: NegotiationOutcome;
  escalationStatus: EscalationStatus;
};

/** Pure negotiation resolution helpers for Q0-20. */
export class NegotiationResolver {
  normalizeCandidates(
    input: TaskNegotiationProtocolInput,
  ): WorkerCapabilityDeclaration[] {
    return (input.candidateWorkers ?? []).map((c) => ({
      workerId: c.workerId.trim(),
      capabilityScore: clamp(c.capabilityScore),
      available: c.available !== false,
      declaredCapabilities: unique(c.declaredCapabilities ?? []),
      declineReason: c.declineReason ?? null,
    }));
  }

  identifyCandidates(
    candidates: WorkerCapabilityDeclaration[],
    requiredCapabilities: string[],
    config: TaskNegotiationProtocolConfiguration,
  ): WorkerCapabilityDeclaration[] {
    return candidates.filter((c) => {
      if (!c.available) return false;
      if (c.capabilityScore < config.minCapabilityScore) return false;
      if (requiredCapabilities.length === 0) return true;
      return requiredCapabilities.every((req) =>
        c.declaredCapabilities.some((cap) => cap.toLowerCase() === req.toLowerCase()),
      );
    });
  }

  detectConflicts(
    candidates: WorkerCapabilityDeclaration[],
    config: TaskNegotiationProtocolConfiguration,
  ): string[] {
    const conflicts: string[] = [];
    const available = candidates.filter((c) => c.available);
    if (available.length === 0) {
      conflicts.push("no_available_candidates");
      return conflicts;
    }
    const ranked = [...available].sort((a, b) => b.capabilityScore - a.capabilityScore);
    if (ranked.length >= 2) {
      const top = ranked[0]!;
      const second = ranked[1]!;
      if (Math.abs(top.capabilityScore - second.capabilityScore) <= config.sharedOwnershipThreshold) {
        conflicts.push(`ownership_tie:${top.workerId}|${second.workerId}`);
      }
    }
    const decliningCapable = candidates.filter(
      (c) =>
        !c.available &&
        c.capabilityScore >= config.minCapabilityScore &&
        c.declaredCapabilities.length > 0,
    );
    for (const d of decliningCapable) {
      conflicts.push(`capable_decline:${d.workerId}`);
    }
    return unique(conflicts);
  }

  resolve(input: TaskNegotiationProtocolInput, config: TaskNegotiationProtocolConfiguration): NegotiationBundle {
    const required = unique(input.requiredCapabilities ?? []);
    const all = this.normalizeCandidates(input);
    const dependencyGraph = (input.dependencyEdges ?? []).map((d) => ({ ...d }));

    if (input.cancel === true) {
      return {
        candidates: all,
        ownership: {
          primaryWorkerId: null,
          ownershipMode: "unresolved",
          rationale: "Negotiation cancelled before ownership resolution",
        },
        supportingWorkers: [],
        dependencyGraph,
        handoffs: [],
        conflicts: ["cancelled"],
        result: "cancelled",
        escalationStatus: "not_required",
      };
    }

    if (input.forceEscalate === true) {
      return {
        candidates: all,
        ownership: {
          primaryWorkerId: null,
          ownershipMode: "unresolved",
          rationale: "Forced escalation to Pillow before ownership resolution",
        },
        supportingWorkers: [],
        dependencyGraph,
        handoffs: [],
        conflicts: ["forced_escalation"],
        result: "escalated",
        escalationStatus: "escalated_to_pillow",
      };
    }

    const eligible = this.identifyCandidates(all, required, config);
    const declining = all.filter((c) => !c.available);
    const conflicts = this.detectConflicts(all, config);

    if (eligible.length === 0) {
      const waiting = dependencyGraph.length > 0;
      return {
        candidates: all,
        ownership: {
          primaryWorkerId: null,
          ownershipMode: "unresolved",
          rationale: waiting
            ? "No eligible workers; waiting on dependency chain"
            : declining.length === all.length && all.length > 0
              ? "All candidates declined"
              : "No eligible candidates for required capabilities",
        },
        supportingWorkers: [],
        dependencyGraph,
        handoffs: [],
        conflicts: conflicts.length ? conflicts : ["no_eligible_workers"],
        result: waiting
          ? "waiting_dependency"
          : declining.length === all.length && all.length > 0
            ? "declined"
            : "escalated",
        escalationStatus:
          waiting || (declining.length === all.length && all.length > 0)
            ? "not_required"
            : "escalated_to_pillow",
      };
    }

    const ranked = [...eligible].sort((a, b) => b.capabilityScore - a.capabilityScore);
    const primary = ranked[0]!;
    const secondary = ranked[1] ?? null;
    const tie =
      secondary != null &&
      Math.abs(primary.capabilityScore - secondary.capabilityScore) <=
        config.sharedOwnershipThreshold;

    if (tie && config.escalateOnTie) {
      return {
        candidates: all,
        ownership: {
          primaryWorkerId: null,
          ownershipMode: "unresolved",
          rationale: `Unresolved ownership tie between ${primary.workerId} and ${secondary!.workerId}`,
        },
        supportingWorkers: ranked.slice(0, 2).map((c) => c.workerId),
        dependencyGraph,
        handoffs: [],
        conflicts,
        result: "escalated",
        escalationStatus: "escalated_to_pillow",
      };
    }

    if (tie) {
      const handoffs: TaskHandoff[] = [
        {
          fromWorkerId: primary.workerId,
          toWorkerId: secondary!.workerId,
          taskId: input.taskId?.trim() || "task-unspecified",
          reason: "shared_ownership_split",
        },
      ];
      return {
        candidates: all,
        ownership: {
          primaryWorkerId: primary.workerId,
          ownershipMode: "shared",
          rationale: `Shared ownership between ${primary.workerId} and ${secondary!.workerId}`,
        },
        supportingWorkers: [secondary!.workerId, ...ranked.slice(2).map((c) => c.workerId)],
        dependencyGraph,
        handoffs,
        conflicts,
        result: "shared_ownership",
        escalationStatus: "not_required",
      };
    }

    const supportingWorkers = ranked.slice(1).map((c) => c.workerId);
    const handoffs: TaskHandoff[] = supportingWorkers.slice(0, 1).map((toWorkerId) => ({
      fromWorkerId: primary.workerId,
      toWorkerId,
      taskId: input.taskId?.trim() || "task-unspecified",
      reason: "support_handoff",
    }));

    const delegated =
      primary.capabilityScore < 70 && supportingWorkers.length > 0
        ? ("delegated" as const)
        : ("accepted" as const);

    return {
      candidates: all,
      ownership: {
        primaryWorkerId: primary.workerId,
        ownershipMode: delegated === "delegated" ? "delegated" : "sole",
        rationale:
          delegated === "delegated"
            ? `Primary ${primary.workerId} accepted with delegated support`
            : `Primary ownership assigned to ${primary.workerId}`,
      },
      supportingWorkers,
      dependencyGraph,
      handoffs,
      conflicts,
      result: delegated,
      escalationStatus: "not_required",
    };
  }
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
