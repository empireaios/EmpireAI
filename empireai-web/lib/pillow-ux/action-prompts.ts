import type { GlobalAssistantAction } from "@/lib/cockpit/global-assistant/types";

/** Structured executive action prompts routed through Pillow (P7-03). */
export function buildPillowActionPrompt(
  action: GlobalAssistantAction,
  input: {
    screenTitle: string;
    screenPath: string;
    targetLabel?: string;
    nextExecutiveAction?: string | null;
  },
): string {
  const screen = `${input.screenTitle} (${input.screenPath})`;

  switch (action) {
    case "summarise":
      return `[Executive Action: Summarise] Provide an executive summary of ${screen}. Include empire health, current mission, builder/supervisor/guardian status, pending approvals, and top risks. Use [Repository Fact] where applicable. Structure: WHY this matters · WHAT the state is · HOW to proceed · PROOF from context.`;
    case "explain":
      return `[Executive Action: Explain] Explain "${input.targetLabel ?? screen}" to the Grand King. Cover WHY it exists, WHAT it does, HOW it connects to the current mission and journey, PROOF from repository/production truth, business impact, engineering impact, architecture impact, risk, and expected benefit.`;
    case "recommend":
      return `[Executive Action: Recommend] Based on complete constitutional context (business, journey, mission, repository, production, runtime), recommend the top 3 executive actions for ${screen}. For each: WHY · WHAT · HOW · PROOF · business impact · engineering impact · risk · expected benefit.`;
    case "next_action":
      return `[Executive Action: Next Action] Determine the single highest-impact next action for the Grand King on ${screen}.${input.nextExecutiveAction ? ` Current hint: ${input.nextExecutiveAction}.` : ""} Explain WHY · WHAT · HOW · PROOF · impacts · risk · benefit.`;
    default:
      return input.targetLabel ?? action;
  }
}
