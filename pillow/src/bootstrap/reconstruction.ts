import {
  gatherExecutiveAssessmentInput,
  generateExecutiveBriefing,
  runExecutiveSelfAssessment,
} from "./executive-self-assessment.js";
import { descriptorFromPath } from "./reconstruction-classifier.js";
import {
  RECONSTRUCTION_ROOT_MARKERS,
  type CategoryCompletenessRule,
  RECONSTRUCTION_CATEGORY_RULES,
} from "./reconstruction-rules.js";
import {
  collectMissingMandatoryCategories,
  resolveReconstructionDependencies,
  validateSourceIntegrity,
  verifyReconstructionCompleteness,
} from "./completeness.js";
import { discoverCanonicalSources } from "./scanner.js";
import type { RepositoryReader } from "./repository-reader.js";
import type {
  ExecutiveBriefing,
  ExecutiveSelfAssessment,
  LoadedArtifact,
  ReconstructionState,
} from "./types.js";

export type ReconstructionPhase = ReconstructionState["phase"];

export interface ReconstructionResult {
  phase: ReconstructionPhase;
  artifacts: LoadedArtifact[];
  state: ReconstructionState;
  missingMandatory: string[];
  integrityIssues: string[];
  selfAssessmentFailures: string[];
  selfAssessment?: ExecutiveSelfAssessment;
  executiveBriefing?: ExecutiveBriefing;
}

/**
 * Repository Reconstruction (PILLOW-002).
 * Pipeline: Discover → Validate → Resolve → Reconstruct → Executive Self-Assessment → Verify → Executive Ready.
 */
export async function reconstructRepository(
  reader: RepositoryReader,
): Promise<ReconstructionResult> {
  let phase: ReconstructionPhase = "discovering";
  const discovered = await discoverCanonicalSources(reader);

  phase = "validating";
  const loaded: LoadedArtifact[] = [];
  for (const relativePath of discovered) {
    const descriptor = descriptorFromPath(relativePath);
    loaded.push(await reader.loadArtifact(descriptor));
  }

  const integrityIssues = validateSourceIntegrity(loaded);
  if (integrityIssues.length > 0) {
    return finalize(phase, loaded, integrityIssues, [], undefined, undefined);
  }

  phase = "resolving_dependencies";
  const resolved = resolveReconstructionDependencies(loaded);

  phase = "reconstructing";

  phase = "executive_self_assessment";
  const assessmentInput = await gatherExecutiveAssessmentInput(reader, resolved);
  const selfAssessment = runExecutiveSelfAssessment(assessmentInput);
  if (!selfAssessment.coherent) {
    return finalize(
      phase,
      resolved,
      [],
      [],
      selfAssessment,
      undefined,
      selfAssessment.failures,
    );
  }

  const executiveBriefing = generateExecutiveBriefing(assessmentInput, selfAssessment);

  phase = "verifying_completeness";
  const completeness = verifyReconstructionCompleteness(resolved);
  const missingMandatory = collectMissingMandatoryCategories(completeness);

  if (missingMandatory.length > 0) {
    return finalize(
      phase,
      resolved,
      [],
      missingMandatory,
      selfAssessment,
      executiveBriefing,
    );
  }

  phase = "executive_ready";
  return finalize(phase, resolved, [], [], selfAssessment, executiveBriefing);
}

export async function validateRepositoryRoot(
  reader: RepositoryReader | null,
): Promise<boolean> {
  if (!reader) return false;
  for (const marker of RECONSTRUCTION_ROOT_MARKERS) {
    if (!(await reader.exists(marker))) return false;
  }
  return true;
}

function finalize(
  phase: ReconstructionPhase,
  artifacts: LoadedArtifact[],
  integrityIssues: string[],
  missingMandatory: string[],
  selfAssessment?: ExecutiveSelfAssessment,
  executiveBriefing?: ExecutiveBriefing,
  selfAssessmentFailures: string[] = [],
): ReconstructionResult {
  const mandatoryRules = RECONSTRUCTION_CATEGORY_RULES.filter(
    (rule: CategoryCompletenessRule) => rule.requirement === "mandatory",
  );
  const optionalRules = RECONSTRUCTION_CATEGORY_RULES.filter(
    (rule: CategoryCompletenessRule) => rule.requirement === "optional",
  );

  const presentMandatoryCategories = new Set(
    artifacts
      .filter((artifact) => artifact.present && artifact.descriptor.requirement === "mandatory")
      .map((artifact) => artifact.descriptor.category),
  );

  const state: ReconstructionState = {
    phase,
    sourcesDiscovered: artifacts.length,
    sourcesLoaded: artifacts.filter((artifact) => artifact.present).length,
    completenessVerified: phase === "executive_ready",
    executiveReady: phase === "executive_ready",
    selfAssessmentPassed: selfAssessment?.coherent ?? false,
    executiveBriefingGenerated: executiveBriefing !== undefined,
    categoryRulesApplied: RECONSTRUCTION_CATEGORY_RULES.length,
    mandatoryCategoriesRequired: mandatoryRules.length,
    mandatoryCategoriesPresent: presentMandatoryCategories.size,
    optionalCategoriesRequired: optionalRules.length,
  };

  return {
    phase,
    artifacts,
    state,
    missingMandatory,
    integrityIssues,
    selfAssessmentFailures,
    selfAssessment,
    executiveBriefing,
  };
}
