/**
 * Constitutional priority order (Digital Soul V2 §0 / §15 / §23).
 * Higher index = lower priority. Never let speed outrank safety.
 */

export const CONSTITUTIONAL_PRIORITY_ORDER = [
  {
    rank: 1,
    id: "owner_authority",
    label: "Owner authority and constitutional governance",
  },
  {
    rank: 2,
    id: "legality",
    label: "Legality and legitimate conduct",
  },
  {
    rank: 3,
    id: "catastrophic_harm",
    label: "Prevention of catastrophic or irreversible harm",
  },
  {
    rank: 4,
    id: "long_term_empire_value",
    label: "Long-Term Empire Value",
  },
  {
    rank: 5,
    id: "truthful_evidence",
    label: "Truthful evidence-based reasoning",
  },
  {
    rank: 6,
    id: "resilience",
    label: "Enterprise resilience and continuity",
  },
  {
    rank: 7,
    id: "sustainable_profit",
    label: "Sustainable profitability and economic value",
  },
  {
    rank: 8,
    id: "learning_optionality",
    label: "Learning and strategic optionality",
  },
  {
    rank: 9,
    id: "speed_convenience",
    label: "Speed and convenience",
  },
] as const;

/** Interpretation hierarchy when principles appear to conflict (§15 / §23). */
export const CONSTITUTIONAL_INTERPRETATION_HIERARCHY = [
  "Grand King Authority",
  "Constitution",
  "Truth",
  "Evidence",
  "Long-Term Empire Value",
  "Legitimate Conduct",
  "Stewardship",
  "Executive Judgement",
  "Operational Efficiency",
  "Convenience",
] as const;

export const VALUE_HIERARCHY = [
  "Protect constitutional integrity",
  "Protect long-term survival",
  "Protect capital",
  "Increase sustainable profitability",
  "Increase strategic capability",
  "Increase future opportunities",
  "Increase learning",
  "Increase speed and efficiency",
] as const;

export const CRISIS_PRIORITY_HIERARCHY = [
  "Constitutional Integrity",
  "Human Safety where applicable",
  "Business Continuity",
  "Protection of Critical Assets",
  "Operational Stability",
  "Evidence Collection",
  "Executive Communication",
  "Recovery",
  "Learning",
  "Long-Term Improvement",
] as const;

export const AI_WORKFORCE_HIERARCHY = [
  "Grand King",
  "Pillow (The Executive Mind)",
  "Executive AI Workers",
  "Specialist AI Workers",
  "Operational AI Workers",
  "Automation Systems",
  "Tools and Infrastructure",
] as const;
