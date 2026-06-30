import type { ReasoningArea } from "./types.js";

export interface PrinciplePattern {
  id: string;
  title: string;
  keywords: RegExp[];
  reasoningArea: ReasoningArea;
  defaultCategory: "A" | "B" | "C" | "D";
  template: string;
}

/** Heuristic patterns for executive learning extraction — not chat memory. */
export const EXECUTIVE_PRINCIPLE_PATTERNS: PrinciplePattern[] = [
  {
    id: "profit-first",
    title: "Profit first",
    keywords: [/profit\s+first/i, /sustainable\s+profit/i, /net\s+profit/i, /ms-a/i],
    reasoningArea: "decision_principles",
    defaultCategory: "A",
    template: "Grand King prioritises sustainable long-term profit over activity.",
  },
  {
    id: "cursor-never-autonomous",
    title: "Cursor never autonomous",
    keywords: [/cursor\s+never\s+autonomous/i, /no\s+autonomous\s+cursor/i, /approval\s+gate/i, /grand\s+king\s+approv/i],
    reasoningArea: "decision_principles",
    defaultCategory: "A",
    template: "Cursor missions and repository writes require Grand King approval — never autonomous.",
  },
  {
    id: "one-objective",
    title: "One objective",
    keywords: [/one\s+objective/i, /single\s+active\s+objective/i, /builder\s+mode/i],
    reasoningArea: "priorities",
    defaultCategory: "A",
    template: "Empire operates with one active objective at a time (Builder Mode discipline).",
  },
  {
    id: "truth-over-agreement",
    title: "Truth over agreement",
    keywords: [/truth\s+over\s+agreement/i, /tell\s+me\s+the\s+truth/i, /no\s+yes-?man/i, /challenge\s+me/i],
    reasoningArea: "leadership_style",
    defaultCategory: "A",
    template: "Grand King expects truthful executive counsel over agreement.",
  },
  {
    id: "roi-over-elegance",
    title: "ROI over engineering elegance",
    keywords: [/roi\s+over/i, /prioriti[sz]e\s+roi/i, /pragmatic\s+over\s+perfect/i, /ship\s+over\s+polish/i],
    reasoningArea: "engineering_philosophy",
    defaultCategory: "A",
    template: "Grand King consistently prioritises ROI over architectural perfection.",
  },
  {
    id: "architecture-decision",
    title: "Architecture decision signal",
    keywords: [/architecture\s+decision/i, /adr-/i, /we\s+should\s+use/i, /design\s+pattern/i],
    reasoningArea: "engineering_philosophy",
    defaultCategory: "B",
    template: "Architecture direction signalled in executive conversation.",
  },
  {
    id: "commercial-strategy",
    title: "Commercial strategy signal",
    keywords: [/marketplace/i, /pricing/i, /margin/i, /supplier/i, /launch\s+strategy/i],
    reasoningArea: "commercial_philosophy",
    defaultCategory: "B",
    template: "Commercial strategy preference expressed in conversation.",
  },
  {
    id: "current-milestone",
    title: "Current milestone focus",
    keywords: [/current\s+milestone/i, /this\s+sprint/i, /this\s+week/i, /right\s+now\s+we/i],
    reasoningArea: "priorities",
    defaultCategory: "C",
    template: "Project working priority for current phase.",
  },
  {
    id: "debugging-context",
    title: "Session debugging context",
    keywords: [/debugging/i, /fixing\s+this\s+bug/i, /today'?s\s+task/i, /this\s+session/i],
    reasoningArea: "recurring_preferences",
    defaultCategory: "D",
    template: "Temporary session task context.",
  },
];

export const CATEGORY_LABELS: Record<"A" | "B" | "C" | "D", string> = {
  A: "Permanent Executive Principle",
  B: "EmpireAI Strategic Knowledge",
  C: "Project Working Knowledge",
  D: "Temporary Session Context",
};
