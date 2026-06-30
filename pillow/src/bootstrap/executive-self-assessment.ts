import { DEFAULT_OBJECTIVE_TITLE } from "../objective/criteria.js";
import {
  parseCurrentMission,
  parseJourneyPosition,
} from "./parsers.js";
import type { RepositoryReader } from "./repository-reader.js";
import {
  buildExecutiveBriefingDocument,
  buildExecutiveDirection,
  buildExecutiveIdentity,
} from "./executive-direction.js";
import type {
  ExecutiveBriefing,
  ExecutiveSelfAssessment,
  ExecutiveSelfAssessmentCriterion,
  LoadedArtifact,
} from "./types.js";

export const EXECUTIVE_SELF_ASSESSMENT_CRITERIA = [
  "executive_identity",
  "supreme_directive",
  "current_objective",
  "current_priority",
  "approved_executive_knowledge",
  "pending_grand_king_decisions",
  "deferred_improvements_awareness",
  "operational_readiness",
] as const;

export type ExecutiveSelfAssessmentCriterionId =
  (typeof EXECUTIVE_SELF_ASSESSMENT_CRITERIA)[number];

export interface ExecutiveAssessmentInput {
  artifacts: LoadedArtifact[];
  soulText: string | null;
  journeyText: string | null;
  statusText: string | null;
  constitutionText: string | null;
  pillowEnhancementRegisterText: string | null;
}

export async function gatherExecutiveAssessmentInput(
  reader: RepositoryReader,
  artifacts: LoadedArtifact[],
): Promise<ExecutiveAssessmentInput> {
  const [soulText, journeyText, statusText, constitutionText, pillowEnhancementRegisterText] =
    await Promise.all([
      reader.readText("EMPIREAI_SOUL.md"),
      reader.readText("JOURNEY.md"),
      reader.readText("EMPIREAI_STATUS.md"),
      reader.readText("EMPIREAI_CONSTITUTION.md"),
      reader.readText("docs/governance/PILLOW_ENHANCEMENT_REGISTER.md"),
    ]);

  return {
    artifacts,
    soulText,
    journeyText,
    statusText,
    constitutionText,
    pillowEnhancementRegisterText,
  };
}

/** Executive Self-Assessment — validates reconstructed executive identity before Executive Ready. */
export function runExecutiveSelfAssessment(
  input: ExecutiveAssessmentInput,
): ExecutiveSelfAssessment {
  const assessedAt = new Date().toISOString();
  const criteria: ExecutiveSelfAssessmentCriterion[] = [
    assessExecutiveIdentity(input),
    assessSupremeDirective(input),
    assessCurrentObjective(input),
    assessCurrentPriority(input),
    assessApprovedExecutiveKnowledge(input),
    assessPendingGrandKingDecisions(input),
    assessDeferredImprovementsAwareness(input),
    assessOperationalReadiness(input),
  ];

  const failures = criteria.filter((criterion) => !criterion.passed).map((c) => c.detail);

  return {
    assessedAt,
    coherent: failures.length === 0,
    criteria,
    failures,
  };
}

export function generateExecutiveBriefing(
  input: ExecutiveAssessmentInput,
  assessment: ExecutiveSelfAssessment,
  refreshTrigger = "bootstrap",
): ExecutiveBriefing {
  const identity = buildExecutiveIdentity(input);
  const direction = buildExecutiveDirection(input);
  return buildExecutiveBriefingDocument(
    identity,
    direction,
    input,
    assessment,
    refreshTrigger,
  );
}

function assessExecutiveIdentity(input: ExecutiveAssessmentInput): ExecutiveSelfAssessmentCriterion {
  const soul = input.soulText ?? "";
  const hasPillowRole = /Pillow[^\n]*(?:strategic|advisor|mission-authoring|executive)/i.test(
    soul,
  );
  const hasEmpireIdentity =
    /manufacture companies/i.test(soul) || /Intelligence Platform/i.test(soul);

  const passed = hasPillowRole && hasEmpireIdentity;
  return {
    id: "executive_identity",
    label: "Executive identity",
    passed,
    detail: passed
      ? "Pillow executive role and EmpireAI identity reconstructed from EMPIREAI_SOUL.md"
      : "Cannot establish executive identity — EMPIREAI_SOUL.md missing Pillow role or EmpireAI identity",
  };
}

function assessSupremeDirective(input: ExecutiveAssessmentInput): ExecutiveSelfAssessmentCriterion {
  const combined = `${input.soulText ?? ""}\n${input.constitutionText ?? ""}`;
  const passed =
    /SUCCESS-001|USD\s*100[,.]?000|MS-A|net profit/i.test(combined) &&
    /Primary mission|CTD-002|manufacture companies/i.test(combined);

  return {
    id: "supreme_directive",
    label: "Supreme Directive",
    passed,
    detail: passed
      ? "Supreme Directive reconstructed — SUCCESS-001 / MS-A net profit mission confirmed"
      : "Cannot establish Supreme Directive — primary profit mission not found in Soul or Constitution",
  };
}

function assessCurrentObjective(input: ExecutiveAssessmentInput): ExecutiveSelfAssessmentCriterion {
  const combined = `${input.journeyText ?? ""}\n${input.statusText ?? ""}`;
  const passed =
    /Version 1|EmpireAI Version 1|Finish EmpireAI|Pillow Runtime|Pillow Executive Intelligence/i.test(
      combined,
    );

  return {
    id: "current_objective",
    label: "Current objective",
    passed,
    detail: passed
      ? `Current objective anchored: ${DEFAULT_OBJECTIVE_TITLE}`
      : `Cannot anchor current objective — Journey/Status lack Version 1 objective markers`,
  };
}

function assessCurrentPriority(input: ExecutiveAssessmentInput): ExecutiveSelfAssessmentCriterion {
  const priority =
    parseJourneyPosition(input.journeyText) ??
    parseCurrentMission(input.journeyText, input.statusText);

  const passed = priority !== null && priority.trim().length > 0;

  return {
    id: "current_priority",
    label: "Current priority",
    passed,
    detail: passed
      ? `Current priority: ${priority}`
      : "Cannot establish current priority — JOURNEY.md and EMPIREAI_STATUS.md lack position markers",
  };
}

function assessApprovedExecutiveKnowledge(
  input: ExecutiveAssessmentInput,
): ExecutiveSelfAssessmentCriterion {
  const present = input.artifacts.filter((artifact) => artifact.present);
  const hasSoul = present.some((a) => a.descriptor.relativePath === "EMPIREAI_SOUL.md");
  const hasConstitution = present.some(
    (a) => a.descriptor.relativePath === "EMPIREAI_CONSTITUTION.md",
  );
  const hasPillowContract = present.some(
    (a) => a.descriptor.relativePath === "PILLOW_ARCHITECTURE_CONTRACT.md",
  );
  const doctrineCount = present.filter((a) => a.descriptor.category === "doctrine").length;

  const passed = hasSoul && hasConstitution && hasPillowContract && doctrineCount >= 2;

  return {
    id: "approved_executive_knowledge",
    label: "Approved executive knowledge availability",
    passed,
    detail: passed
      ? `Executive knowledge available — Soul, Constitution, Pillow contract, ${doctrineCount} doctrine(s)`
      : "Insufficient approved executive knowledge — require Soul, Constitution, Pillow contract, and ≥2 doctrines",
  };
}

function assessPendingGrandKingDecisions(
  input: ExecutiveAssessmentInput,
): ExecutiveSelfAssessmentCriterion {
  if (!input.journeyText) {
    return {
      id: "pending_grand_king_decisions",
      label: "Pending Grand King decisions",
      passed: false,
      detail: "Cannot assess pending Grand King decisions — JOURNEY.md unavailable",
    };
  }

  const pending = parsePendingGrandKingDecisions(input.journeyText);
  const passed = true;

  return {
    id: "pending_grand_king_decisions",
    label: "Pending Grand King decisions",
    passed,
    detail:
      pending.length > 0
        ? `${pending.length} pending Grand King decision(s) identified`
        : "Pending Grand King decision scan complete — none flagged in Journey",
  };
}

function assessDeferredImprovementsAwareness(
  input: ExecutiveAssessmentInput,
): ExecutiveSelfAssessmentCriterion {
  const deferred = parseDeferredImprovements(
    input.pillowEnhancementRegisterText,
    input.journeyText,
  );
  const passed = deferred.source !== "unavailable";

  return {
    id: "deferred_improvements_awareness",
    label: "Deferred improvements awareness",
    passed,
    detail: passed
      ? `${deferred.count} deferred improvement(s) tracked via ${deferred.source}`
      : "Cannot establish deferred improvements awareness — no register or Journey fallback",
  };
}

function assessOperationalReadiness(
  input: ExecutiveAssessmentInput,
): ExecutiveSelfAssessmentCriterion {
  const mandatory = input.artifacts.filter(
    (artifact) => artifact.descriptor.requirement === "mandatory",
  );
  const missingMandatory = mandatory.filter((artifact) => !artifact.present);
  const emptyMandatory = mandatory.filter(
    (artifact) => artifact.present && artifact.sizeBytes === 0,
  );

  const passed = missingMandatory.length === 0 && emptyMandatory.length === 0;

  return {
    id: "operational_readiness",
    label: "Operational readiness",
    passed,
    detail: passed
      ? `Operational readiness confirmed — ${mandatory.length} mandatory source(s) present`
      : `Operational readiness failed — ${missingMandatory.length} missing, ${emptyMandatory.length} empty mandatory source(s)`,
  };
}

export function parsePendingGrandKingDecisions(journeyText: string | null): string[] {
  if (!journeyText) return [];

  const pending: string[] = [];
  for (const line of journeyText.split("\n")) {
    const isDeferred = line.includes("🔵");
    const needsGk =
      /Grand King review|pending Grand King|GK approval|Grand King approval required/i.test(line);
    if (!isDeferred && !needsGk) continue;

    const labelMatch = line.match(/\|\s*([^|]+?)\s*\|/);
    const label = labelMatch?.[1]?.trim() ?? line.trim().slice(0, 120);
    if (label.length > 0) pending.push(label);
  }

  return [...new Set(pending)].slice(0, 25);
}

export function parseDeferredImprovements(
  registerText: string | null,
  journeyText: string | null,
): { count: number; samples: string[]; source: string } {
  const samples: string[] = [];

  if (registerText) {
    for (const match of registerText.matchAll(
      /\|\s*(PILLOW-ENH-\d+)[^\n]*\|[^\n]*\|\s*(Future|Proposed|Scheduled|Deferred|Observed)[^\n]*\|/gi,
    )) {
      const id = match[1];
      if (id) samples.push(id);
    }
    return {
      count: samples.length,
      samples: [...new Set(samples)].slice(0, 15),
      source: "docs/governance/PILLOW_ENHANCEMENT_REGISTER.md",
    };
  }

  if (journeyText) {
    for (const match of journeyText.matchAll(/\|\s*(PILLOW-\d{3})[^\n]*\|[^\n]*🔵[^\n]*\|/g)) {
      const id = match[1];
      if (id) samples.push(id);
    }
    return {
      count: samples.length,
      samples: [...new Set(samples)].slice(0, 15),
      source: "JOURNEY.md fallback",
    };
  }

  return { count: 0, samples: [], source: "unavailable" };
}
