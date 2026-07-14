/** T4-07 — Maps T4-06 explanation records to approval context. */

import type { ExplainDecisionsEngine } from "../explain-decisions/engine.js";
import type { ExplanationRecord } from "../explain-decisions/types.js";
import type { ApprovalPresentationInput } from "./types.js";
import { appendApprovalLog } from "./approval-logging.js";

export class ExplanationApprovalMapper {
  load(input: {
    presentationInput: ApprovalPresentationInput;
    explainDecisions: ExplainDecisionsEngine | null;
  }): ExplanationRecord | null {
    if (!input.explainDecisions) return null;
    try {
      const report = input.explainDecisions.getLatestReport?.() ?? null;
      const explanation = report?.explanation ?? null;
      if (
        input.presentationInput.explanationId &&
        explanation?.explanationId !== input.presentationInput.explanationId
      ) {
        appendApprovalLog({
          event: "partial_approval_input",
          level: "warn",
          details: "Requested explanation ID not found in latest report",
        });
      }
      return explanation;
    } catch {
      appendApprovalLog({
        event: "partial_approval_input",
        level: "warn",
        details: "Explain decisions data unavailable",
      });
      return null;
    }
  }
}
