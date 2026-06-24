import { randomUUID } from "node:crypto";
import type { AuthorityLevel, DecisionRecord } from "./types.js";

export type DecisionRequest = {
  agentId: string;
  action: string;
  authorityLevel: AuthorityLevel;
  rationale: string;
  metadata?: Record<string, unknown>;
  founderApproved?: boolean;
};

const APPROVAL_REQUIRED: AuthorityLevel[] = ["L3", "L4"];

export class DecisionEngine {
  evaluate(request: DecisionRequest): DecisionRecord {
    const requiresFounderApproval = APPROVAL_REQUIRED.includes(
      request.authorityLevel,
    );

    let approved = true;

    if (request.authorityLevel === "L4") {
      approved = Boolean(request.founderApproved);
    } else if (request.authorityLevel === "L3") {
      approved = Boolean(request.founderApproved);
    }

    return {
      id: randomUUID(),
      agentId: request.agentId,
      action: request.action,
      authorityLevel: request.authorityLevel,
      approved,
      requiresFounderApproval,
      rationale: request.rationale,
      timestamp: new Date().toISOString(),
    };
  }

  canExecute(decision: DecisionRecord): boolean {
    if (!decision.requiresFounderApproval) {
      return true;
    }
    return decision.approved;
  }
}
