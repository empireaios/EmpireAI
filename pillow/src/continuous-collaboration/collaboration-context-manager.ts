/** T4-09 — Builds and maintains collaboration context from upstream history. */

import type { ContinuousCollaborationEngineBundle } from "./types.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import { appendCollaborationLog } from "./collaboration-logging.js";

export class CollaborationContextManager {
  buildContext(input: {
    engines: ContinuousCollaborationEngineBundle;
    config: ContinuousCollaborationConfiguration;
  }): {
    summary: string;
    activeUxGoals: string[];
    activeDesignDirection: string | null;
    confidenceScore: number;
  } {
    const parts: string[] = [];
    const goals: string[] = [];
    let confidence = 0.5;

    try {
      const conversation = input.engines.naturalUxConversation?.getLatestReport?.() ?? null;
      const turn = conversation?.latestTurn ?? null;
      if (turn) {
        parts.push(`Conversation: ${turn.recognizedIntent} (${turn.intentCategory})`);
        goals.push(...turn.generatedUxActions.map((a) => a.description).slice(0, 3));
        confidence = Math.max(confidence, turn.confidenceScore);
      }
    } catch {
      appendCollaborationLog({
        event: "partial_collaboration_input",
        level: "warn",
        details: "Conversation history unavailable",
      });
    }

    try {
      const proposals = input.engines.multiProposalGenerator?.getLatestReport?.() ?? null;
      if (proposals?.proposals.length) {
        parts.push(`${proposals.proposals.length} active proposal(s)`);
        confidence = Math.max(
          confidence,
          proposals.proposals.reduce((s, p) => s + p.confidenceScore, 0) /
            proposals.proposals.length,
        );
      }
    } catch {
      appendCollaborationLog({
        event: "partial_collaboration_input",
        level: "warn",
        details: "Proposal history unavailable",
      });
    }

    try {
      const approval = input.engines.approvalWorkflow?.getLatestReport?.() ?? null;
      if (approval?.approval) {
        parts.push(`Last approval: ${approval.approval.approvalDecision}`);
        if (approval.approval.approvedActionScope) {
          goals.push(approval.approval.approvedActionScope);
        }
      }
    } catch {
      appendCollaborationLog({
        event: "partial_collaboration_input",
        level: "warn",
        details: "Approval history unavailable",
      });
    }

    const designDirection =
      input.engines.approvalWorkflow?.getState?.().latestPresentation?.comparisonSummary ??
      input.engines.explainDecisions?.getLatestReport?.()?.explanation?.designRationale?.slice(
        0,
        120,
      ) ??
      null;

    if (parts.length === 0) {
      parts.push("Awaiting Grand King UX collaboration input");
    }

    return {
      summary: parts.join(" · "),
      activeUxGoals: goals.slice(0, input.config.maxActiveDiscussions),
      activeDesignDirection: designDirection,
      confidenceScore: Math.round(confidence * 100) / 100,
    };
  }
}
