/** T5-03 — Machine-readable opportunity metadata generation. */

import { randomUUID } from "node:crypto";
import { OPPORTUNITY_METADATA_VERSION } from "./paths.js";
import type {
  ComplexityLevel,
  OpportunityCategory,
  OpportunityPriority,
  OpportunityRecord,
  OpportunityStatus,
  RawOpportunityCandidate,
} from "./types.js";

export class OpportunityMetadataGenerator {
  buildRecords(input: {
    sourceAuditId: string | null;
    sourceObservationId: string | null;
    currentScreenId: string | null;
    currentRouteOrViewId: string | null;
    candidates: Array<RawOpportunityCandidate & { priority: OpportunityPriority }>;
    opportunityStatus: OpportunityStatus;
  }): OpportunityRecord[] {
    return input.candidates.map((candidate) => ({
      opportunityId: `uod-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      sourceAuditId: input.sourceAuditId,
      sourceObservationId: input.sourceObservationId,
      currentScreenId: input.currentScreenId,
      currentRouteOrViewId: input.currentRouteOrViewId,
      opportunityCategory: candidate.category,
      opportunitySummary: candidate.summary,
      expectedUxBenefit: candidate.expectedBenefit,
      estimatedImplementationComplexity: candidate.complexity,
      priority: candidate.priority,
      evidenceReferences: candidate.evidenceReferences,
      confidenceScore: candidate.confidenceScore,
      opportunityStatus: input.opportunityStatus,
      metadataVersion: OPPORTUNITY_METADATA_VERSION,
      discoverOnly: true,
    }));
  }
}

export function mapIssueCategoryToOpportunity(
  issueCategory: string,
): OpportunityCategory {
  const map: Record<string, OpportunityCategory> = {
    layout_issue: "layout_improvement",
    component_issue: "component_improvement",
    navigation_issue: "navigation_improvement",
    workflow_issue: "workflow_improvement",
    accessibility_issue: "accessibility_improvement",
    visual_consistency_issue: "visual_consistency_improvement",
    loading_state_issue: "performance_related_ux_improvement",
    empty_state_issue: "interaction_improvement",
    error_state_issue: "feedback_improvement",
    readability_issue: "readability_improvement",
    hierarchy_issue: "information_hierarchy_improvement",
    spacing_issue: "layout_improvement",
    alignment_issue: "layout_improvement",
    feedback_issue: "feedback_improvement",
  };
  return map[issueCategory] ?? "interaction_improvement";
}

export function defaultComplexityForCategory(
  category: OpportunityCategory,
): ComplexityLevel {
  const high: OpportunityCategory[] = [
    "workflow_improvement",
    "navigation_improvement",
    "performance_related_ux_improvement",
  ];
  const low: OpportunityCategory[] = [
    "readability_improvement",
    "feedback_improvement",
  ];
  if (high.includes(category)) return "high";
  if (low.includes(category)) return "low";
  return "medium";
}