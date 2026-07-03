import type { GlobalAssistantResponse } from "@/lib/cockpit/global-assistant/types";
import type { PillowChatResult } from "@/lib/pillow/types";

/** Map Pillow host chat result to G4-09 panel response shape. */
export function mapPillowChatToAssistantResponse(
  result: PillowChatResult,
  query: string,
): GlobalAssistantResponse {
  const awareness = result.command?.awareness;
  const recommendation = result.executiveRecommendation;

  const supportingEvidence = [];
  if (awareness?.journeyPosition) {
    supportingEvidence.push({
      source: "pillow-host",
      label: "Journey position",
      value: awareness.journeyPosition,
    });
  }
  if (awareness?.currentMission) {
    supportingEvidence.push({
      source: "pillow-host",
      label: "Current mission",
      value: awareness.currentMission,
    });
  }
  if (typeof awareness?.repositoryHealthScore === "number") {
    supportingEvidence.push({
      source: "pillow-host",
      label: "Repository health",
      value: String(awareness.repositoryHealthScore),
    });
  }
  if (recommendation) {
    supportingEvidence.push({
      source: "executive-council",
      label: "Recommendation confidence",
      value: String(recommendation.confidence),
    });
  }

  const recommendedNextAction =
    recommendation?.recommendation ??
    result.command?.plan?.steps?.[0]?.label ??
    "Continue the conversation or ask Pillow to open a Cockpit module.";

  return {
    action: "ask",
    currentContext: awareness?.journeyPosition ?? "Pillow host session active",
    reason: recommendation?.reason ?? result.command?.plan?.objective ?? "Pillow NL response",
    supportingEvidence,
    recommendedNextAction,
    confidence: recommendation
      ? recommendation.confidence >= 0.75
        ? "high"
        : recommendation.confidence >= 0.5
          ? "medium"
          : "low"
      : result.kind === "llm"
        ? "medium"
        : "unavailable",
    suggestedFollowUps: [],
    interactionIntent: result.command?.intent ?? result.kind,
    interactionSummary: result.message,
    computedAt: new Date().toISOString(),
    futureCapabilities: [],
  };
}
