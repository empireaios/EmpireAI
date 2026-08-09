import type { GlobalAssistantContext } from "@/lib/cockpit/global-assistant/types";
import type { PillowExecutiveContextSnapshot, PillowGuidanceItem } from "./types";

type FounderShellPayload = {
  founderShellEngine?: {
    cockpit?: {
      shellHealth?: string;
      context?: {
        currentBusiness?: string | null;
        currentMission?: string | null;
        currentJourney?: string | null;
        currentNotifications?: number;
        currentRecommendations?: string[];
      };
      executiveHome?: {
        businessStatus?: string;
        missionStatus?: string;
        builderStatus?: string;
        supervisorStatus?: string;
        productionStatus?: string;
        revenue?: string;
        alerts?: string[];
        recommendations?: string[];
        currentJourney?: string;
        pendingActions?: string[];
      };
      grandKingSummary?: string;
    };
  };
} | null;

export function buildExecutiveContextSnapshot(input: {
  founderShell?: FounderShellPayload;
  brainContext?: GlobalAssistantContext | null;
  pendingApprovals?: number;
  nextExecutiveAction?: string | null;
}): PillowExecutiveContextSnapshot {
  const cockpit = input.founderShell?.founderShellEngine?.cockpit;
  const ctx = cockpit?.context;
  const home = cockpit?.executiveHome;
  const executive = input.brainContext?.executiveContext;

  const alerts = home?.alerts ?? [];
  const recommendations = [
    ...(home?.recommendations ?? []),
    ...(ctx?.currentRecommendations ?? []),
  ].filter(Boolean);

  const risks = alerts.map((a) => a.replace(/^⚠\s*/, ""));

  return {
    currentBusiness: ctx?.currentBusiness ?? home?.businessStatus ?? null,
    currentMission: ctx?.currentMission ?? home?.missionStatus ?? executive?.topMissionTitle ?? null,
    currentJourney: home?.currentJourney ?? ctx?.currentJourney ?? null,
    currentRoadmapItem: home?.currentJourney ?? ctx?.currentJourney ?? null,
    builderStatus: home?.builderStatus ?? null,
    supervisorStatus: home?.supervisorStatus ?? null,
    productionStatus: home?.productionStatus ?? null,
    guardianStatus: cockpit?.shellHealth ?? null,
    pendingApprovals: input.pendingApprovals ?? executive?.activeMissionCount ?? 0,
    alertCount: executive?.alertCount ?? alerts.length,
    recommendations: [...new Set(recommendations)].slice(0, 6),
    risks: [...new Set(risks)].slice(0, 6),
    nextExecutiveAction:
      input.nextExecutiveAction ?? executive?.nextExecutiveAction ?? home?.pendingActions?.[0] ?? null,
    grandKingSummary: cockpit?.grandKingSummary ?? null,
  };
}

export function buildProactiveGuidance(snapshot: PillowExecutiveContextSnapshot): PillowGuidanceItem[] {
  const items: PillowGuidanceItem[] = [];

  if (snapshot.nextExecutiveAction) {
    items.push({
      id: "next-action",
      kind: "recommendation",
      title: "Next Executive Action",
      why: "Executive Home and Founder Shell identify this as the highest-priority action.",
      what: snapshot.nextExecutiveAction,
      how: "Review the recommendation, confirm alignment with current mission, then approve or delegate.",
      expectedBenefit: "Maintains mission momentum without manual context gathering.",
      suggestedPrompt: `Explain why this is my next action: ${snapshot.nextExecutiveAction}`,
    });
  }

  for (const [index, rec] of snapshot.recommendations.slice(0, 3).entries()) {
    items.push({
      id: `rec-${index}`,
      kind: "recommendation",
      title: "Pillow Recommendation",
      why: "Pillow continuously analyses repository, production, and business state.",
      what: rec,
      how: "Ask Pillow to elaborate with proof from repository and production truth.",
      proof: "Founder Shell executive home summary",
      suggestedPrompt: `Explain this recommendation with proof: ${rec}`,
    });
  }

  for (const [index, risk] of snapshot.risks.slice(0, 2).entries()) {
    items.push({
      id: `risk-${index}`,
      kind: "risk",
      title: "Current Risk",
      why: "Guardian, Supervisor, or certification systems flagged attention.",
      what: risk,
      how: "Ask Pillow for impact analysis and recommended recovery steps.",
      risk: risk,
      engineeringImpact: "May block Builder or production certification paths.",
      suggestedPrompt: `Analyse this risk and recommend recovery: ${risk}`,
    });
  }

  if (snapshot.builderStatus && !/ready|healthy|complete/i.test(snapshot.builderStatus)) {
    items.push({
      id: "builder-status",
      kind: "recovery",
      title: "Builder Attention",
      why: "Builder status indicates active or blocked engineering work.",
      what: `Builder: ${snapshot.builderStatus}`,
      how: "Review Builder Console for mission progress, ETA, and recovery options.",
      engineeringImpact: "Engineering throughput may be affected.",
      suggestedPrompt: "What is the current Builder status and what should I do next?",
    });
  }

  if (snapshot.pendingApprovals > 0) {
    items.push({
      id: "pending-approvals",
      kind: "mission",
      title: "Pending Approvals",
      why: "Executive approvals gate mission execution and capital deployment.",
      what: `${snapshot.pendingApprovals} approval(s) awaiting Grand King decision.`,
      how: "Review approval queue and decide approve, reject, or request more evidence.",
      businessImpact: "Delayed approvals slow mission and revenue execution.",
      suggestedPrompt: "Summarise my pending approvals and recommend decisions.",
    });
  }

  return items.slice(0, 6);
}
