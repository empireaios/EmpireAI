import type { IntelligenceClassification } from "./types.js";

const ID_PATTERNS: Array<{
  pattern: RegExp;
  classification: IntelligenceClassification;
}> = [
  { pattern: /^REAL-\d{3}$/, classification: "reality_owner" },
  { pattern: /^UX-\d{3}$/, classification: "ux" },
  { pattern: /^GC-\d{2}$/, classification: "global_component" },
  { pattern: /^PILLOW-\d{3}$/, classification: "pillow" },
  { pattern: /^ADR-\d{3}$/, classification: "decision" },
  { pattern: /^BL-[A-C]$/, classification: "backlog" },
  { pattern: /^CTD-\d{3}$/, classification: "constitution" },
  { pattern: /^CTD-\d{2}$/, classification: "constitution" },
  { pattern: /^CTD-\d{1}$/, classification: "constitution" },
];

export function classifyById(id: string): IntelligenceClassification {
  for (const { pattern, classification } of ID_PATTERNS) {
    if (pattern.test(id)) return classification;
  }
  return "unknown";
}

export function classifyByPath(relativePath: string): IntelligenceClassification {
  const base = relativePath.split(/[/\\]/).pop() ?? relativePath;

  if (/^EMPIREAI_CONSTITUTION\.md$/i.test(base)) return "constitution";
  if (/^EMPIREAI_.*_DOCTRINE\.md$/i.test(base)) return "doctrine";
  if (/^JOURNEY\.md$/i.test(base)) return "journey";
  if (/^JOURNEY_AUDIT\.md$/i.test(base)) return "journey_audit";
  if (/PILLOW_ARCHITECTURE/i.test(base)) return "architecture";
  if (/UX_IMPLEMENTATION_CONTRACT/i.test(base)) return "contract";
  if (/^BL-[A-C]\.md$/i.test(base)) return "backlog";
  if (/UX_ENHANCEMENT_REGISTER/i.test(base)) return "enhancement_register";
  if (/EXECUTIVE_AUDIT|VALIDATION_REPORT|DIFFERENCE_REPORT/i.test(base)) {
    return "executive_audit";
  }
  if (/^EMPIREAI_DECISIONS\.md$/i.test(base)) return "decision";
  if (/^EMPIREAI_COMMERCE/i.test(base)) return "commercial_spine";
  if (/^EMPIREAI_(STATUS|SOUL|ROADMAP)/i.test(base)) return "operational_document";
  if (/^EMPIREAI_/i.test(base)) return "governance";
  if (/components\/system/i.test(relativePath)) return "executive_component";

  return "unknown";
}

export function inferClassification(
  id: string,
  relativePath?: string,
): IntelligenceClassification {
  const byId = classifyById(id);
  if (byId !== "unknown") return byId;
  if (relativePath) {
    const byPath = classifyByPath(relativePath);
    if (byPath !== "unknown") return byPath;
  }
  return "unknown";
}

export const EXECUTIVE_COMPONENT_EXPORTS = [
  "ExecutiveHeader",
  "ExecutiveSidebar",
  "ExecutiveKpiCard",
  "ExecutiveKpiGrid",
  "ExecutivePanel",
  "MissionBriefPanel",
  "ApprovalPanel",
  "AlertBanner",
  "ExecutiveTable",
  "GlobalFilters",
  "CommandPalette",
] as const;

export const GLOBAL_COMPONENT_IDS = [
  "GC-01",
  "GC-02",
  "GC-03",
  "GC-04",
  "GC-05",
  "GC-06",
  "GC-07",
] as const;
