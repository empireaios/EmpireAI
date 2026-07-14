/** T4-07 — Maps T4-05 comparison records to approval context. */

import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { SideBySideComparisonRecord } from "../side-by-side-comparison/types.js";
import type { ApprovalPresentationInput } from "./types.js";
import { appendApprovalLog } from "./approval-logging.js";

export class ComparisonApprovalMapper {
  load(input: {
    presentationInput: ApprovalPresentationInput;
    sideBySideComparison: SideBySideComparisonEngine | null;
  }): SideBySideComparisonRecord | null {
    if (!input.sideBySideComparison) return null;
    try {
      const report = input.sideBySideComparison.getLatestReport?.() ?? null;
      const comparison = report?.comparison ?? null;
      if (
        input.presentationInput.comparisonId &&
        comparison?.comparisonId !== input.presentationInput.comparisonId
      ) {
        appendApprovalLog({
          event: "partial_approval_input",
          level: "warn",
          details: "Requested comparison ID not found in latest report",
        });
      }
      return comparison;
    } catch {
      appendApprovalLog({
        event: "partial_approval_input",
        level: "warn",
        details: "Side-by-side comparison data unavailable",
      });
      return null;
    }
  }
}
