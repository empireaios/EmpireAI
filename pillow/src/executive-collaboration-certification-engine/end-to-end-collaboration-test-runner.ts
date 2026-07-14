/** T4-10 — End-to-end Executive Collaboration test runner. */

import { appendCertificationLog } from "./certification-logging.js";
import type { T4EngineBundle } from "./t4-capability-validator.js";
import type { E2eValidationResult, E2eValidationStep } from "./types.js";

export class EndToEndCollaborationTestRunner {
  async run(engines: T4EngineBundle): Promise<E2eValidationResult> {
    const started = Date.now();
    const steps: E2eValidationStep[] = [];

    appendCertificationLog({
      event: "e2e_collaboration_start",
      level: "info",
      details: "Starting end-to-end Executive Collaboration validation",
    });

    try {
      const conversation = engines.naturalUxConversation.converse(
        "Grand King requests UX collaboration on dashboard navigation",
      );
      steps.push({
        step: "T4-01 Natural UX conversation begins",
        passed: !!conversation.conversationRunReportId && !!conversation.latestTurn,
        details: conversation.latestTurn
          ? `intent=${conversation.latestTurn.recognizedIntent}`
          : "No conversation turn",
      });

      const voice = engines.voiceUxCommands.processCommand({
        simulatedTranscript: "show UX proposals for review",
      });
      steps.push({
        step: "T4-02 Voice commands interpreted",
        passed: !!voice.voiceCommandRunReportId && !!voice.latestCommand,
        details: voice.latestCommand
          ? `type=${voice.latestCommand.voiceCommandType}`
          : "No voice command",
      });

      const annotation = engines.screenAnnotation.annotate({
        annotationType: "highlight",
        annotationText: "Grand King highlights navigation panel for review",
      });
      steps.push({
        step: "T4-03 Screen annotations captured",
        passed: !!annotation.annotationRunReportId && !!annotation.latestAnnotation,
        details: annotation.latestAnnotation
          ? `type=${annotation.latestAnnotation.annotationType}`
          : "No annotation",
      });

      const proposals = engines.multiProposalGenerator.generateProposals();
      steps.push({
        step: "T4-04 Multiple redesign proposals generated",
        passed: !!proposals.proposalGenerationRunReportId && proposals.proposals.length > 0,
        details: `${proposals.proposals.length} proposal(s)`,
      });

      const comparison = engines.sideBySideComparison.compare({
        comparisonType: "original_vs_proposal",
      });
      steps.push({
        step: "T4-05 Side-by-side comparisons produced",
        passed: !!comparison.comparisonRunReportId && !!comparison.comparison,
        details: comparison.comparison
          ? `comparisonId=${comparison.comparison.comparisonId}`
          : "No comparison",
      });

      const explanation = engines.explainDecisions.explain({
        explanationType: "proposal_rationale",
      });
      steps.push({
        step: "T4-06 Design rationale explanations generated",
        passed: !!explanation.explanationRunReportId && !!explanation.explanation,
        details: explanation.explanation
          ? `type=${explanation.explanation.explanationType}`
          : "No explanation",
      });

      engines.approvalWorkflow.present({});
      const rejectReport = engines.approvalWorkflow.submitApproval({
        approvalDecision: "reject",
        approvalRationale: "Certification test — unapproved changes must be blocked",
      });
      steps.push({
        step: "T4-07 Approval workflow blocks unapproved actions",
        passed:
          rejectReport.gatekeeperResult.blocked === true &&
          rejectReport.dispatchResult.dispatched === false,
        details: `decision=${rejectReport.approval.approvalDecision} · blocked=${rejectReport.gatekeeperResult.blocked}`,
      });

      const approveReport = engines.approvalWorkflow.submitApproval({
        approvalDecision: "approve",
        approvalRationale: "Grand King explicit approval for certification",
        grandKingConfirmationRef: "gk-cert-test",
      });
      steps.push({
        step: "T4-07 Grand King approval workflow enforced",
        passed: approveReport.gatekeeperResult.allowed === true,
        details: `approved scope=${approveReport.approval.approvedActionScope ?? "set"}`,
      });

      const learning = engines.preferenceLearning.learn();
      steps.push({
        step: "T4-08 Collaboration preferences updated",
        passed:
          !!learning.preferenceLearningRunReportId &&
          learning.preferences.length > 0 &&
          learning.validation.decision !== "fail",
        details: `${learning.preferences.length} preference(s) · ${learning.validation.decision}`,
      });

      const collaboration = engines.continuousCollaboration.synchronize({
        restoreContext: true,
        applyPreferences: true,
      });
      steps.push({
        step: "T4-09 Continuous collaboration context maintained",
        passed:
          !!collaboration.collaborationRunReportId &&
          !!collaboration.session.collaborationContextSummary &&
          collaboration.validation.decision !== "fail",
        details: `session=${collaboration.session.collaborationSessionId}`,
      });

      const passed = steps.every((s) => s.passed);
      const durationMs = Date.now() - started;

      appendCertificationLog({
        event: "e2e_collaboration_end",
        level: passed ? "info" : "warn",
        details: `E2E ${passed ? "PASS" : "FAIL"} · ${steps.filter((s) => s.passed).length}/${steps.length} steps · ${durationMs}ms`,
      });

      return {
        passed,
        steps,
        durationMs,
        summary: passed
          ? "Full T4 Executive Collaboration pipeline operational end-to-end"
          : `${steps.filter((s) => !s.passed).length} step(s) failed`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "E2E collaboration failed";
      appendCertificationLog({
        event: "e2e_collaboration_failure",
        level: "error",
        details: message,
      });
      return {
        passed: false,
        steps,
        durationMs: Date.now() - started,
        summary: message,
      };
    }
  }
}
