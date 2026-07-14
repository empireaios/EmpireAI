/** T4-04 — Shared proposal builder helpers for category generators. */

import type { ImplementationScope, ProposalCategory } from "./types.js";
import type { InterpretedProposalRequirements } from "./proposal-requirement-interpreter.js";
import { ProposalMetadataGenerator } from "./proposal-metadata-generator.js";
import { PROPOSAL_METADATA_VERSION } from "./paths.js";
import type { RedesignProposalRecord } from "./types.js";

const BUILDER_CAPS: Record<ProposalCategory, string[]> = {
  layout_redesign: ["layout_refactoring", "frontend_builder"],
  component_redesign: ["component_generator", "frontend_builder"],
  navigation_redesign: ["layout_refactoring", "frontend_builder"],
  workflow_redesign: ["frontend_builder", "layout_refactoring"],
  theme_redesign: ["theme_builder"],
  accessibility_improvement: ["validation_engine", "component_generator"],
  visual_consistency_improvement: ["theme_builder", "validation_engine"],
  dashboard_improvement: ["layout_refactoring", "frontend_builder"],
  form_improvement: ["component_generator", "frontend_builder"],
  table_improvement: ["component_generator", "frontend_builder"],
  card_improvement: ["component_generator", "theme_builder"],
  modal_improvement: ["component_generator", "preview_generator"],
  drawer_improvement: ["component_generator", "layout_refactoring"],
  loading_state_improvement: ["component_generator", "frontend_builder"],
  empty_state_improvement: ["component_generator", "theme_builder"],
  error_state_improvement: ["component_generator", "validation_engine"],
};

export type ProposalDraft = {
  category: ProposalCategory;
  title: string;
  summary: string;
  proposedUxChange: string;
  expectedUxBenefit: string;
  scope: ImplementationScope;
  riskNotes: string | null;
  confidence: number;
  variantIndex: number;
};

export function buildProposalRecord(
  draft: ProposalDraft,
  requirements: InterpretedProposalRequirements,
  linkedUxFindingIds: string[],
  metadata = new ProposalMetadataGenerator(),
): RedesignProposalRecord {
  return metadata.enrichProposal({
    proposalId: metadata.buildProposalId(),
    timestamp: new Date().toISOString(),
    sourceConversationIntentId: requirements.sourceConversationIntentId,
    sourceVoiceCommandId: requirements.sourceVoiceCommandId,
    sourceAnnotationId: requirements.sourceAnnotationId,
    sourcePointAndEditIntentId: requirements.sourcePointAndEditIntentId,
    targetScreenId: requirements.targetScreenId,
    targetRouteOrViewId: requirements.targetRouteOrViewId,
    targetComponentIds: requirements.targetComponentIds,
    targetLayoutRegionIds: requirements.targetLayoutRegionIds,
    targetNavigationNodeIds: requirements.targetNavigationNodeIds,
    proposalCategory: draft.category,
    proposalTitle: draft.title,
    proposalSummary: draft.summary,
    proposedUxChange: draft.proposedUxChange,
    expectedUxBenefit: draft.expectedUxBenefit,
    linkedUxFindingIds,
    linkedBuilderCapabilities: BUILDER_CAPS[draft.category] ?? ["frontend_builder"],
    estimatedImplementationScope: draft.scope,
    riskNotes: draft.riskNotes,
    confidenceScore: draft.confidence,
    metadataVersion: PROPOSAL_METADATA_VERSION,
  });
}

export function variantLabel(variantIndex: number): string {
  if (variantIndex === 0) return "Conservative";
  if (variantIndex === 1) return "Balanced";
  return "Ambitious";
}
