/** T5-08 — Machine-readable workspace intelligence metadata generation. */

import { randomUUID } from "node:crypto";
import { WORKSPACE_INTELLIGENCE_METADATA_VERSION } from "./paths.js";
import type {
  RawWorkspaceCandidate,
  WorkspaceIntelligenceRecord,
  WorkspacePriority,
  WorkspaceStatus,
} from "./types.js";

export class WorkspaceMetadataGenerator {
  buildRecords(input: {
    candidates: Array<RawWorkspaceCandidate & { workspacePriority: WorkspacePriority }>;
    recordStatus: WorkspaceStatus;
  }): WorkspaceIntelligenceRecord[] {
    return input.candidates.map((candidate) => ({
      workspaceIntelligenceId: `ewi-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      sourceUxEvolutionId: candidate.sourceUxEvolutionId ?? null,
      sourceAdaptiveInterfaceId: candidate.sourceAdaptiveInterfaceId ?? null,
      sourceWorkflowEvolutionId: candidate.sourceWorkflowEvolutionId ?? null,
      sourceProductivityIntelligenceId: candidate.sourceProductivityIntelligenceId ?? null,
      activeMissionContext: candidate.activeMissionContext,
      executivePriorities: candidate.executivePriorities,
      recommendedDashboardLayout: candidate.recommendedDashboardLayout,
      recommendedWorkspaceConfiguration: candidate.recommendedWorkspaceConfiguration,
      recommendedWidgets: candidate.recommendedWidgets,
      recommendedShortcuts: candidate.recommendedShortcuts,
      expectedProductivityBenefit: candidate.expectedProductivityBenefit,
      workspaceCategory: candidate.workspaceCategory,
      workspacePriority: candidate.workspacePriority,
      evidenceReferences: candidate.evidenceReferences,
      confidenceScore: candidate.confidenceScore,
      status: input.recordStatus,
      metadataVersion: WORKSPACE_INTELLIGENCE_METADATA_VERSION,
      recommendOnly: true,
    }));
  }
}
