/** T5-09 — Outcome analysis from approvals, deployments, and audits. */

import { appendLearningLog } from "./siux-logging.js";
import type { ApprovalRecord } from "../approval-workflow/types.js";
import type { ChangeDocumentationRecord } from "../change-documentation/types.js";
import type { UxAuditRecord } from "../autonomous-ux-audit-engine/types.js";
import type { WorkflowEvolutionRecord } from "../workflow-evolution-engine/types.js";
import type { ProductivityIntelligenceRecord } from "../productivity-intelligence-engine/types.js";
import type { RawLearningCandidate } from "./types.js";

export class OutcomeAnalysisEngine {
  analyze(input: {
    approvals: ApprovalRecord[];
    changeRecords: ChangeDocumentationRecord[];
    audit: UxAuditRecord | null;
    evolutionRecords: WorkflowEvolutionRecord[];
    productivityRecords: ProductivityIntelligenceRecord[];
  }): RawLearningCandidate[] {
    const candidates: RawLearningCandidate[] = [];

    for (const approval of input.approvals) {
      const category =
        approval.approvalDecision === "approve"
          ? "approval_learning"
          : approval.approvalDecision === "reject"
            ? "approval_learning"
            : "executive_preference_learning";
      candidates.push({
        learningCategory: category,
        learnedUxInsight: `Grand King ${approval.approvalDecision}: ${approval.approvalRationale ?? "UX decision"}`,
        improvementSummary: `Learn from ${approval.approvalDecision} decision for future UX proposals`,
        recommendationImprovement:
          approval.approvalDecision === "approve"
            ? "Reinforce approved UX patterns in future recommendations"
            : "Deprioritize rejected UX patterns in future recommendations",
        prioritizationImprovement:
          approval.approvalDecision === "approve"
            ? "Increase priority for Grand King-approved change types"
            : "Decrease priority for Grand King-rejected change types",
        sourceRedesignHistory: [],
        sourceDeploymentOutcomes: [],
        sourceApprovalHistory: [approval.approvalId],
        evidenceReferences: [`approval:${approval.approvalId}`],
        confidenceScore: approval.confidenceScore,
        impactScore: approval.approvalDecision === "approve" ? 0.85 : 0.72,
        sourceEngine: "PILLOW-AW-001",
      });
    }

    for (const change of input.changeRecords.filter(
      (c) => c.finalChangeStatus === "accepted" || c.finalChangeStatus === "rejected",
    )) {
      candidates.push({
        learningCategory: "deployment_learning",
        learnedUxInsight: `Deployment outcome: ${change.finalChangeStatus}`,
        improvementSummary: `Learn from ${change.finalChangeStatus} deployment for operational UX`,
        recommendationImprovement: "Calibrate deployment-ready recommendations from outcomes",
        prioritizationImprovement: "Weight deployment success signals in prioritization",
        sourceRedesignHistory: [change.changeDocumentationId],
        sourceDeploymentOutcomes: [change.finalChangeStatus ?? "unknown"],
        sourceApprovalHistory: [],
        evidenceReferences: [change.changeDocumentationId],
        confidenceScore: change.confidenceScore ?? 0.7,
        impactScore: change.finalChangeStatus === "accepted" ? 0.8 : 0.65,
        sourceEngine: "PILLOW-CD-001",
      });
    }

    for (const issue of input.audit?.detectedUxIssues ?? []) {
      const category = this.mapIssueToCategory(issue.category);
      candidates.push({
        learningCategory: category,
        learnedUxInsight: `UX failure signal: ${issue.description}`,
        improvementSummary: "Learn from detected UX issues to prevent recurrence",
        recommendationImprovement: `Avoid recommending patterns that cause: ${issue.category}`,
        prioritizationImprovement: "Elevate fixes for recurring UX failure categories",
        sourceRedesignHistory: [],
        sourceDeploymentOutcomes: [],
        sourceApprovalHistory: [],
        evidenceReferences: [issue.evidenceReference],
        confidenceScore: issue.detectionConfidence,
        impactScore: 0.7,
        sourceEngine: issue.sourceEngine,
      });
    }

    for (const wfe of input.evolutionRecords) {
      candidates.push({
        learningCategory: "workflow_learning",
        learnedUxInsight: `Workflow evolution outcome: ${wfe.recommendedWorkflowImprovements[0] ?? "workflow"}`,
        improvementSummary: wfe.estimatedProductivityBenefit ?? "Workflow productivity gain",
        recommendationImprovement: "Improve workflow UX recommendations from evolution evidence",
        prioritizationImprovement: "Rank workflow improvements by measured productivity benefit",
        sourceRedesignHistory: [],
        sourceDeploymentOutcomes: [],
        sourceApprovalHistory: [],
        evidenceReferences: [...wfe.evidenceReferences, `wfe:${wfe.workflowEvolutionId}`],
        confidenceScore: wfe.confidenceScore,
        impactScore: 0.77,
        sourceEngine: "PILLOW-WFE-001",
        sourceWorkflowEvolutionId: wfe.workflowEvolutionId,
      });
    }

    for (const pie of input.productivityRecords) {
      candidates.push({
        learningCategory: "productivity_learning",
        learnedUxInsight: `Productivity pattern: ${pie.workflowPatternSummary}`,
        improvementSummary: "Learn productivity gains for future UX prioritization",
        recommendationImprovement: "Align recommendations with proven productivity patterns",
        prioritizationImprovement: "Boost UX changes that improve recurring task efficiency",
        sourceRedesignHistory: [],
        sourceDeploymentOutcomes: [],
        sourceApprovalHistory: [],
        evidenceReferences: [...pie.evidenceReferences, `pie:${pie.productivityId}`],
        confidenceScore: pie.confidenceScore,
        impactScore: 0.75,
        sourceEngine: "PILLOW-PIE-001",
      });
    }

    appendLearningLog({
      event: "experience_analysis",
      level: "info",
      details: `Analyzed ${input.approvals.length} approvals · ${input.changeRecords.length} changes`,
    });

    return candidates;
  }

  private mapIssueToCategory(category: string): RawLearningCandidate["learningCategory"] {
    if (category === "accessibility_issue") return "accessibility_learning";
    if (category === "navigation_issue") return "navigation_learning";
    if (category === "hierarchy_issue" || category === "spacing_issue") return "layout_learning";
    if (category === "component_issue") return "component_learning";
    return "continuous_ux_intelligence_learning";
  }
}
