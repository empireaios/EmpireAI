import { DEFAULT_OBJECTIVE_TITLE } from "../objective/criteria.js";
import {
  parseCurrentMission,
  parseJourneyPosition,
  parseKnownActiveWork,
} from "./parsers.js";
import type { ExecutiveAssessmentInput } from "./executive-self-assessment.js";
import {
  parseDeferredImprovements,
  parsePendingGrandKingDecisions,
} from "./executive-self-assessment.js";
import type {
  ExecutiveBriefing,
  ExecutiveDirection,
  ExecutiveIdentity,
  ExecutiveSelfAssessment,
  LoadedArtifact,
} from "./types.js";

export function buildExecutiveIdentity(input: ExecutiveAssessmentInput): ExecutiveIdentity {
  const soul = input.soulText ?? "";
  const pillowRole =
    soul.match(/Pillow[^\n]+/i)?.[0]?.trim() ??
    "Pillow — strategic AI advisor and mission-authoring intelligence";
  const empirePurpose =
    soul.match(/manufacture companies[^\n]*/i)?.[0]?.trim() ??
    "EmpireAI manufactures companies — Intelligence Platform, never Automation Platform";

  return {
    narrative: `${empirePurpose} · ${pillowRole}`,
    pillowRole,
    empirePurpose,
    refreshedAt: new Date().toISOString(),
  };
}

export function buildExecutiveDirection(input: ExecutiveAssessmentInput): ExecutiveDirection {
  const supremeDirective = extractSupremeDirective(input.soulText, input.constitutionText);
  const currentObjective = DEFAULT_OBJECTIVE_TITLE;
  const currentStrategicPriority =
    parseJourneyPosition(input.journeyText) ??
    parseCurrentMission(input.journeyText, input.statusText) ??
    "Unknown — review JOURNEY.md and EMPIREAI_STATUS.md";

  return {
    supremeDirective,
    currentObjective,
    currentStrategicPriority,
    currentBlockers: parseCurrentBlockers(input.journeyText, input.statusText),
    explicitlyDeferredWork: parseExplicitlyDeferredWork(
      input.journeyText,
      input.pillowEnhancementRegisterText,
    ),
    currentEmpirePhase: parseEmpirePhase(input.journeyText, input.statusText),
    pendingGrandKingDecisions: parsePendingGrandKingDecisions(input.journeyText),
    refreshedAt: new Date().toISOString(),
    sourceArtifacts: [
      "JOURNEY.md",
      "EMPIREAI_STATUS.md",
      "EMPIREAI_SOUL.md",
      "PILLOW_ROADMAP.md",
      "docs/governance/PILLOW_ENHANCEMENT_REGISTER.md",
    ],
  };
}

export function buildExecutiveBriefingDocument(
  identity: ExecutiveIdentity,
  direction: ExecutiveDirection,
  input: ExecutiveAssessmentInput,
  assessment: ExecutiveSelfAssessment,
  refreshTrigger = "bootstrap",
): ExecutiveBriefing {
  const generatedAt = new Date().toISOString();
  const knowledge = summarizeExecutiveKnowledge(input.artifacts);
  const deferred = parseDeferredImprovements(
    input.pillowEnhancementRegisterText,
    input.journeyText,
  );

  const operationalReadiness = assessment.coherent
    ? "Executive self-assessment passed — Pillow may begin reasoning."
    : "Executive self-assessment incomplete — reasoning blocked.";

  const narrative = [
    "══════════════════════════════════════════════════════════",
    "  PILLOW EXECUTIVE BRIEFING (continuous strategic anchor)",
    "══════════════════════════════════════════════════════════",
    "",
    `Refreshed: ${direction.refreshedAt} · Trigger: ${refreshTrigger}`,
    "",
    "## Executive Identity",
    identity.narrative,
    "",
    "## Executive Direction",
    `Supreme Directive: ${direction.supremeDirective}`,
    `Current Objective: ${direction.currentObjective}`,
    `Strategic Priority: ${direction.currentStrategicPriority}`,
    `Empire Phase: ${direction.currentEmpirePhase}`,
    "",
    "### Current Blockers",
    direction.currentBlockers.length > 0
      ? direction.currentBlockers.map((item) => `  • ${item}`).join("\n")
      : "  • None flagged in Journey/Status",
    "",
    "### Explicitly Deferred Work",
    direction.explicitlyDeferredWork.length > 0
      ? direction.explicitlyDeferredWork.map((item) => `  • ${item}`).join("\n")
      : "  • None flagged",
    "",
    "### Pending Grand King Decisions",
    direction.pendingGrandKingDecisions.length > 0
      ? direction.pendingGrandKingDecisions.map((item) => `  • ${item}`).join("\n")
      : "  • None identified in Journey",
    "",
    "## Approved Executive Knowledge",
    knowledge,
    "",
    "## Operational Readiness",
    operationalReadiness,
    "",
    "Executive Briefing is the continuous strategic anchor for all executive reasoning cycles.",
  ].join("\n");

  return {
    generatedAt,
    refreshedAt: direction.refreshedAt,
    identity,
    direction,
    executiveKnowledgeSummary: knowledge,
    operationalReadiness,
    narrative,
    supremeDirective: direction.supremeDirective,
    currentObjective: direction.currentObjective,
    currentPriority: direction.currentStrategicPriority,
    pendingGrandKingDecisions: direction.pendingGrandKingDecisions,
    deferredImprovementsAwareness: `${deferred.count} deferred (${deferred.source})`,
  };
}

export function parseEmpirePhase(
  journeyText: string | null,
  statusText: string | null,
): string {
  if (journeyText) {
    const positionLine = journeyText.match(
      /\*\*Current project position[^*]*\*\*[:\s]*([^\n]+)/i,
    );
    if (positionLine?.[1]) return positionLine[1].trim();

    const roadmapMatch = journeyText.match(
      /Pillow Executive Intelligence|Commercial Intelligence|Empire Operations|Go-Live/i,
    );
    if (roadmapMatch) return roadmapMatch[0];
  }

  if (statusText) {
    const statusPhase = statusText.match(/Current project position[^\n]*\n([^\n]+)/i);
    if (statusPhase?.[1]) return statusPhase[1].trim();
  }

  return "Review JOURNEY.md for current Empire phase";
}

export function parseCurrentBlockers(
  journeyText: string | null,
  statusText: string | null,
): string[] {
  const blockers = new Set<string>();

  const scan = (text: string | null) => {
    if (!text) return;
    for (const line of text.split("\n")) {
      if (!line.includes("🔴") && !/blocker|REAL-002B|PROOF-001|GK-GOLIVE/i.test(line)) {
        continue;
      }
      const label = line.match(/\|\s*([^|]+?)\s*\|/)?.[1]?.trim();
      if (label) blockers.add(label);
    }
  };

  scan(journeyText);
  scan(statusText);

  return [...blockers].slice(0, 20);
}

export function parseExplicitlyDeferredWork(
  journeyText: string | null,
  registerText: string | null,
): string[] {
  const deferred = new Set<string>();

  const improvementDeferred = parseDeferredImprovements(registerText, journeyText);
  for (const sample of improvementDeferred.samples) {
    deferred.add(sample);
  }

  if (journeyText) {
    for (const match of journeyText.matchAll(/\|\s*([^|]+?)\s*\|[^\n]*🔵[^\n]*\|/g)) {
      const label = match[1]?.trim();
      if (label) deferred.add(label);
    }

    const active = parseKnownActiveWork(journeyText, null);
    for (const mission of active.nextMissions) {
      deferred.add(mission);
    }
  }

  return [...deferred].slice(0, 25);
}

function extractSupremeDirective(
  soulText: string | null,
  constitutionText: string | null,
): string {
  const combined = `${soulText ?? ""}\n${constitutionText ?? ""}`;
  const mission = combined.match(/Primary mission[^\n]*/i)?.[0];
  const success = combined.match(/SUCCESS-001[^\n]*/i)?.[0];
  return (
    [mission, success].filter(Boolean).join(" · ") ||
    "USD 100,000 net profit (SUCCESS-001 / MS-A)"
  );
}

function summarizeExecutiveKnowledge(artifacts: LoadedArtifact[]): string {
  const present = artifacts.filter((artifact) => artifact.present);
  const categories = new Set(present.map((artifact) => artifact.descriptor.category));
  return `${present.length} canonical source(s) across ${categories.size} categories`;
}

export function shouldRefreshExecutiveDirection(event: {
  type: string;
  paths: string[];
}): boolean {
  if (event.type === "JourneyUpdated" || event.type === "SynchronizationCompleted") {
    return true;
  }

  const authoritative = [
    /JOURNEY\.md/i,
    /EMPIREAI_STATUS\.md/i,
    /PILLOW_ROADMAP\.md/i,
    /EMPIREAI_ROADMAP\.md/i,
    /EMPIREAI_SOUL\.md/i,
    /PILLOW_ARCHITECTURE_CONTRACT\.md/i,
  ];

  if (
    event.type === "RepositoryUpdated" ||
    event.type === "DoctrineUpdated" ||
    event.type === "ArchitectureChanged"
  ) {
    return event.paths.some((path) => authoritative.some((pattern) => pattern.test(path)));
  }

  return false;
}
