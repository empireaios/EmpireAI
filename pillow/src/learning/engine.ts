import { classifyLearningCandidate, partitionByCategory } from "./classifier.js";
import { scoreLearningConfidence } from "./confidence.js";
import { extractLearningCandidates } from "./extractor.js";
import { analyzeLearningImpact } from "./impact-analyzer.js";
import { buildPatternObservation, detectRepeatedPatterns } from "./pattern-detector.js";
import type {
  ConversationLearningInput,
  LearningPipelineResult,
  PendingExecutiveLearning,
} from "./types.js";

/**
 * Executive Learning Engine — Pipeline C (PEI-026 / PEI-021 alignment).
 * Analyses conversations for executive learnings — NOT chat memory.
 */
export class ExecutiveLearningEngine {
  runPipeline(
    input: ConversationLearningInput,
    existingPending: PendingExecutiveLearning[] = [],
    existingApprovedTitles: string[] = [],
  ): LearningPipelineResult {
    const extracted = extractLearningCandidates(input);
    const { durable, sessionOnly } = partitionByCategory(extracted);

    const patternMatches = detectRepeatedPatterns(
      durable,
      existingPending,
      existingApprovedTitles,
    );

    const candidates = patternMatches.map((match) => {
      const confidence = scoreLearningConfidence(match.candidate, match.repetitionCount);
      const impact = analyzeLearningImpact(match.candidate);
      const classification = classifyLearningCandidate(match.candidate);

      return {
        ...match.candidate,
        confidence: Math.min(0.99, confidence.score + match.confidenceBoost),
        description: buildPatternObservation(match),
        impactSummary: impact.summary,
        requiresGrandKingApproval:
          classification.requiresGrandKingApproval || impact.requiresExplicitApproval,
      };
    });

    return {
      candidates,
      sessionContext: sessionOnly,
      pipelineStages: [
        "conversation",
        "learning_candidate_extraction",
        "classification",
        "confidence_scoring",
        "impact_analysis",
        "pending_executive_learning",
      ],
    };
  }
}

export function createExecutiveLearningEngine(): ExecutiveLearningEngine {
  return new ExecutiveLearningEngine();
}
