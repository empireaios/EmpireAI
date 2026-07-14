/** T4-07 — Dispatches approved actions to certified builder systems. */

import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { ApprovalWorkflowConfiguration } from "./configuration.js";
import type { ApprovalStatus } from "./types.js";
import { appendApprovalLog } from "./approval-logging.js";

export class ApprovedActionDispatcher {
  dispatch(input: {
    status: ApprovalStatus;
    approvedScope: string | null;
    proposalIds: string[];
    config: ApprovalWorkflowConfiguration;
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
  }): { dispatched: boolean; targetSystem: string | null; scope: string | null } {
    if (input.status !== "approved") {
      return { dispatched: false, targetSystem: null, scope: null };
    }

    if (!input.config.approvedActionDispatchRulesEnabled) {
      appendApprovalLog({
        event: "approved_action_dispatch",
        level: "info",
        details: "Dispatch rules disabled — approval recorded only",
      });
      return {
        dispatched: false,
        targetSystem: null,
        scope: input.approvedScope,
      };
    }

    let certificationReady = false;
    if (input.autonomousBuilderCertification) {
      try {
        const state = input.autonomousBuilderCertification.getState();
        certificationReady = state.health.status !== "failed";
      } catch {
        appendApprovalLog({
          event: "partial_approval_input",
          level: "warn",
          details: "Certified builder system state unavailable",
        });
      }
    }

    appendApprovalLog({
      event: "approved_action_dispatch",
      level: "info",
      details: `Dispatching ${input.proposalIds.length} proposal(s) to certified builder — ready: ${certificationReady}`,
    });

    return {
      dispatched: true,
      targetSystem: "autonomous_builder_certification",
      scope: input.approvedScope ?? `proposals:${input.proposalIds.join(",")}`,
    };
  }
}
