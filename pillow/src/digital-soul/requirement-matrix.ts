import type { ConstitutionalRequirement, DigitalSoulSectionId } from "./types.js";

const DS_TESTS = ["pillow/src/validation/tests/digital-soul.test.ts"] as const;
const DS_RUNTIME = [
  "pillow/src/digital-soul/principles.ts",
  "pillow/src/digital-soul/engine.ts",
  "pillow/src/digital-soul/prompt.ts",
] as const;
const CONSTITUTION = ["EMPIREAI_DIGITAL_SOUL_CONSTITUTION_V2.md"] as const;

function sectionReq(
  section: DigitalSoulSectionId,
  requirement: string,
  status: ConstitutionalRequirement["status"],
  implementationFiles: string[],
  runtimeBehaviour: string,
  notes?: string,
): ConstitutionalRequirement {
  return {
    id: `REQ-${section}-COVERAGE`,
    section,
    requirement,
    status,
    implementationFiles,
    runtimeBehaviour,
    tests: [...DS_TESTS],
    notes,
  };
}

/**
 * Constitutional Requirement Matrix — Digital Soul V2 Appendix A.
 * Covers Sections 0–23 and Appendix A against verified repository integration.
 * Status reflects repository-backed evidence for this mission.
 */
export const CONSTITUTIONAL_REQUIREMENT_MATRIX: readonly ConstitutionalRequirement[] = [
  // ── Mission completion gates (Appendix A / Section 0) ─────────────────
  {
    id: "REQ-CANONICAL-DOC",
    section: "S0",
    requirement:
      "Complete submitted Constitution exists verbatim as canonical constitutional document (Sections 0–23 + Appendix A)",
    status: "Newly Implemented",
    implementationFiles: [
      ...CONSTITUTION,
      "docs/governance/digital-soul/DIGITAL_SOUL_PRIOR_DRAFTS_ARCHIVED.md",
      "docs/governance/digital-soul/EMPIREAI_DIGITAL_SOUL_CONSTITUTION_V2_CONDENSED_SUPERSEDED.md",
    ],
    runtimeBehaviour:
      "DigitalSoulRuntime loads and verifies full V2 markers (SECTION 0–23, APPENDIX A, CANONICAL MASTER EDITION)",
    tests: [...DS_TESTS],
    notes: "Condensed prior draft archived; verbatim Master Edition is sole governing text",
  },
  {
    id: "REQ-RUNTIME-ACCESS",
    section: "A",
    requirement: "Runtime access to constitutional principles",
    status: "Strengthened",
    implementationFiles: [...DS_RUNTIME],
    runtimeBehaviour: "DigitalSoulRuntime exposes principles, prompt block, and snapshot",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-EXEC-REASONING",
    section: "S2",
    requirement: "Executive reasoning integration",
    status: "Strengthened",
    implementationFiles: [
      "pillow/src/bootstrap/executive-reasoning-context.ts",
      "pillow/src/bootstrap/executive-direction.ts",
      "pillow/src/openai/engine.ts",
      "pillow/src/objective/constitution.ts",
    ],
    runtimeBehaviour: "Digital Soul prompt + notes injected into briefing and LLM system context",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-DECISION-RECORDS",
    section: "S8",
    requirement: "Persistent decision records",
    status: "Implemented",
    implementationFiles: [
      "pillow/src/digital-soul/decision-record.ts",
      "docs/governance/digital-soul/executive-decision-records.jsonl",
    ],
    runtimeBehaviour: "JSONL append-only executive decision store under governance",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-EVIDENCE-ASSUMPTION",
    section: "S8",
    requirement: "Evidence and assumption separation",
    status: "Implemented",
    implementationFiles: ["pillow/src/digital-soul/compliance.ts"],
    runtimeBehaviour: "evaluateConstitutionalCompliance separates facts/assumptions/inferences/unknowns",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-APPROVAL-BOUNDARY",
    section: "S0",
    requirement: "Approval boundary enforcement",
    status: "Strengthened",
    implementationFiles: [
      "pillow/src/digital-soul/compliance.ts",
      "pillow/src/objective/proposal-model.ts",
      "pillow/src/objective/constitutional-gates.ts",
    ],
    runtimeBehaviour:
      "Irreversible/major capital/constitutional actions flagged requiresGrandKingApproval; existing proposal gates retained",
    tests: [...DS_TESTS, "pillow/src/validation/tests/objective.test.ts"],
  },
  {
    id: "REQ-OPERATING-RHYTHM",
    section: "S10",
    requirement: "Operating rhythm support",
    status: "Implemented",
    implementationFiles: ["pillow/src/digital-soul/operating-rhythm.ts"],
    runtimeBehaviour: "Callable daily/weekly/monthly/quarterly/continuous reviews",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-OPPORTUNITY",
    section: "S5",
    requirement: "Opportunity discovery support",
    status: "Strengthened",
    implementationFiles: [
      "pillow/src/digital-soul/loops.ts",
      "pillow/src/business-opportunity-discovery/",
      "pillow/src/company-factory-framework/",
    ],
    runtimeBehaviour:
      "Constitutional opportunity pipeline encoded; BOD/CFF remain canonical operational engines",
    tests: [
      "pillow/src/validation/tests/business-opportunity-discovery.test.ts",
      ...DS_TESTS,
    ],
    notes: "Operational discovery reused — no duplicate opportunity engine",
  },
  {
    id: "REQ-CAPITAL",
    section: "S6",
    requirement: "Capital allocation support",
    status: "Strengthened",
    implementationFiles: [
      "pillow/src/digital-soul/priority.ts",
      "backend/src/orchestration/pillow-host/capital-allocation-engine-bridge.ts",
      "backend/src/orchestration/pillow-host/executive-capital-strategy-bridge.ts",
    ],
    runtimeBehaviour:
      "Allocation principles encoded; existing capital engines remain canonical execution path",
    tests: [...DS_TESTS],
    notes: "Reuse existing capital bridges — no duplicate capital engine",
  },
  {
    id: "REQ-FOUNDER",
    section: "S9",
    requirement: "Founder and business creation support",
    status: "Strengthened",
    implementationFiles: [
      "pillow/src/digital-soul/principles.ts",
      "pillow/src/business-model-generator/",
      "pillow/src/company-factory-framework/",
    ],
    runtimeBehaviour: "Founder principles in runtime; CFF/BMG remain operational creation engines",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-SELF-REVIEW",
    section: "S7",
    requirement: "Self-review and learning support",
    status: "Strengthened",
    implementationFiles: [
      "pillow/src/digital-soul/loops.ts",
      "pillow/src/bootstrap/executive-self-assessment.ts",
    ],
    runtimeBehaviour: "Learning loop + self-critique principles; existing assessment retained",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-RISK-CRISIS",
    section: "S13",
    requirement: "Risk and crisis support",
    status: "Implemented",
    implementationFiles: [
      "pillow/src/digital-soul/priority.ts",
      "pillow/src/digital-soul/principles.ts",
      "pillow/src/digital-soul/operating-rhythm.ts",
    ],
    runtimeBehaviour: "Crisis priority hierarchy and resilience principles available at runtime",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-COMPLIANCE-CHECK",
    section: "A",
    requirement: "Constitutional compliance checks",
    status: "Implemented",
    implementationFiles: ["pillow/src/digital-soul/compliance.ts", "pillow/src/digital-soul/engine.ts"],
    runtimeBehaviour: "Callable evaluateConstitutionalCompliance / engine.evaluate",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-INTERFACES",
    section: "A",
    requirement: "Relevant interfaces or callable services",
    status: "Implemented",
    implementationFiles: [
      "pillow/src/digital-soul/engine.ts",
      "pillow/src/session.ts",
      "backend/src/orchestration/pillow-host/digital-soul-bridge.ts",
      "backend/src/orchestration/pillow-host/routes/pillow-routes.ts",
    ],
    runtimeBehaviour: "Session accessors + /api/pillow/digital-soul* routes",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-TESTS",
    section: "A",
    requirement: "Automated tests",
    status: "Strengthened",
    implementationFiles: ["pillow/src/validation/tests/digital-soul.test.ts"],
    runtimeBehaviour: "node:test suite verifies verbatim constitution markers and runtime integration",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-PROD-SAFE",
    section: "S0",
    requirement: "Production-safe failure handling",
    status: "Implemented",
    implementationFiles: ["pillow/src/digital-soul/engine.ts", "pillow/src/digital-soul/compliance.ts"],
    runtimeBehaviour:
      "Missing/incomplete constitution exposed as limitations; no fake PASS; compliance never throws on empty input",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-DOCS-REPORT",
    section: "A",
    requirement: "Implementation documentation and evidence-backed mission report",
    status: "Strengthened",
    implementationFiles: [
      "docs/governance/digital-soul/CONSTITUTIONAL_REQUIREMENT_MATRIX.md",
      "docs/audits/digital-soul/DIGITAL_SOUL_V2_IMPLEMENTATION_REPORT.md",
      "docs/governance/EMPIREAI_DIGITAL_SOUL_SYSTEM.md",
    ],
    runtimeBehaviour: "Matrix + report + system governance doc",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-NO-EMPTY-SHELL",
    section: "S0",
    requirement: "No Empty Shell Principle — no placeholders or fake executive intelligence",
    status: "Implemented",
    implementationFiles: [
      "pillow/src/digital-soul/engine.ts",
      "pillow/src/digital-soul/compliance.ts",
      "pillow/src/digital-soul/decision-record.ts",
    ],
    runtimeBehaviour: "Real persistence, real compliance evaluation, real rhythm reviews; limitations disclosed",
    tests: [...DS_TESTS],
  },
  {
    id: "REQ-TRACEABILITY",
    section: "A",
    requirement: "Constitutional Requirement Matrix with status classification for all sections",
    status: "Newly Implemented",
    implementationFiles: [
      "pillow/src/digital-soul/requirement-matrix.ts",
      "docs/governance/digital-soul/CONSTITUTIONAL_REQUIREMENT_MATRIX.md",
    ],
    runtimeBehaviour: "Matrix exposed via runtime.getRequirementMatrix() and /api/pillow/digital-soul/matrix",
    tests: [...DS_TESTS],
  },

  // ── Per-section coverage (entire submitted document) ──────────────────
  sectionReq(
    "S0",
    "Mission authority, implementation duty, single executive mind, priority order, owner control, non-fabrication",
    "Implemented",
    [...CONSTITUTION, ...DS_RUNTIME, "pillow/src/digital-soul/priority.ts", "pillow/src/digital-soul/compliance.ts"],
    "Priority order + non-fabrication + irreversibility enforced in compliance and prompt",
  ),
  sectionReq(
    "S1",
    "Constitutional preamble — LTEV purpose, success/failure meaning, generational and truth principles",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "pillow/src/objective/constitution.ts"],
    "Permanent duty and LTEV supreme directive in runtime and objective constitution",
  ),
  sectionReq(
    "S2",
    "Executive identity, thinking loop, observation/curiosity/reasoning principles",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/loops.ts", "pillow/src/bootstrap/executive-reasoning-context.ts"],
    "Permanent executive question and thinking loop wired into reasoning context",
  ),
  sectionReq(
    "S3",
    "Empire Value Function — holistic LTEV, hierarchy of value, anti-vanity",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "pillow/src/digital-soul/priority.ts"],
    "LTEV optimisation and value hierarchy encoded in principles and priority module",
  ),
  sectionReq(
    "S4",
    "Probability-at-scale, learning loop, reality supremacy, executive memory of experiments",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/loops.ts", "pillow/src/digital-soul/decision-record.ts"],
    "Learning loop + reality-over-belief principles; decision/experiment memory via JSONL",
  ),
  sectionReq(
    "S5",
    "Opportunity discovery, pipeline, portfolio, elimination/replacement principles",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/loops.ts", "pillow/src/business-opportunity-discovery/"],
    "Constitutional opportunity doctrine + reuse of BOD engine",
  ),
  sectionReq(
    "S6",
    "Capital, resource, and attention allocation constitution",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/priority.ts", "backend/src/orchestration/pillow-host/capital-allocation-engine-bridge.ts"],
    "Scarcity/allocation principles + existing capital bridges",
  ),
  sectionReq(
    "S7",
    "Self-evolution, knowledge lifecycle, self-critique, capability multipliers",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/loops.ts", "pillow/src/bootstrap/executive-self-assessment.ts"],
    "Self-improvement and knowledge compounding principles in runtime",
  ),
  sectionReq(
    "S8",
    "Executive decision cycle, accountability, approval packs, post-decision review",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/decision-record.ts", "pillow/src/digital-soul/compliance.ts"],
    "Decision records + evidence/assumption separation + Grand King approval flags",
  ),
  sectionReq(
    "S9",
    "Founder mind, business generation, expansion, Grand King First for new engines",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/company-factory-framework/", "pillow/src/business-model-generator/"],
    "Founder principles + CFF/BMG operational engines retained",
  ),
  sectionReq(
    "S10",
    "Enterprise operating system and permanent executive operating rhythm",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/operating-rhythm.ts"],
    "Callable operating rhythm across enterprise domains",
  ),
  sectionReq(
    "S11",
    "Daily/weekly/monthly/quarterly executive operating doctrine",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/operating-rhythm.ts"],
    "Cadence-specific focus questions for daily through quarterly reviews",
  ),
  sectionReq(
    "S12",
    "Opportunity hunting, competitive intelligence, strategic discovery",
    "Partially Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "pillow/src/business-opportunity-discovery/"],
    "Doctrine and principles encoded; dedicated competitive-intel radar remains shared with BOD/portfolio engines",
    "Full standalone Opportunity Radar engine deferred — reuse BOD/portfolio signal paths (no empty shell)",
  ),
  sectionReq(
    "S13",
    "Crisis, anti-fragility, survivability, SPOF reduction",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/priority.ts", "pillow/src/digital-soul/operating-rhythm.ts"],
    "Crisis priority hierarchy and resilience principles in runtime",
  ),
  sectionReq(
    "S14",
    "Grand King communication, trust, non-manipulation, signal-over-noise",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/prompt.ts", "pillow/src/digital-soul/compliance.ts"],
    "Trust/truth/non-manipulation encoded in prompt and compliance findings",
  ),
  sectionReq(
    "S15",
    "Digital Soul charter, executive oath, constitutional continuity and self-preservation",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "pillow/src/digital-soul/version.ts"],
    "Charter principles and oath language in principles/prompt; verbatim constitution preserved",
  ),
  sectionReq(
    "S16",
    "Economic value and long-term prosperity doctrine",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "pillow/src/objective/constitution.ts"],
    "LTEV and compounding/optionality principles in runtime objective layer",
  ),
  sectionReq(
    "S17",
    "Executive reasoning and judgement doctrine (alternatives, trade-offs, red team)",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/compliance.ts", "pillow/src/bootstrap/executive-reasoning-context.ts"],
    "Structured reasoning notes + compliance challenge for major recommendations",
  ),
  sectionReq(
    "S18",
    "Knowledge, truth, and evidence doctrine",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/compliance.ts", "pillow/src/digital-soul/decision-record.ts"],
    "Evidence quality separation and institutional decision memory",
  ),
  sectionReq(
    "S19",
    "Enterprise architecture and system design doctrine",
    "Partially Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "docs/governance/EMPIREAI_DIGITAL_SOUL_SYSTEM.md"],
    "Constitution-first architecture principles encoded; enterprise-wide architectural review is ongoing governance practice",
    "No separate architecture-enforcement engine — principles guide existing modular architecture (preserve, don't duplicate)",
  ),
  sectionReq(
    "S20",
    "AI Workforce and executive delegation doctrine",
    "Strengthened",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "pillow/src/digital-soul/prompt.ts"],
    "Hierarchy Grand King → Pillow → workers encoded in principles/prompt; specialised engines remain subordinates",
    "Reuse existing specialist engines under Pillow — no duplicate workforce identity layer",
  ),
  sectionReq(
    "S21",
    "Research, innovation, and invention doctrine / Executive Laboratory",
    "Partially Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "pillow/src/digital-soul/loops.ts"],
    "Research/innovation principles and learning loops active; Executive Laboratory as named process is doctrinal + loop-backed",
    "Dedicated laboratory persistence store deferred with justification — learning loops + decision records serve as laboratory trail",
  ),
  sectionReq(
    "S22",
    "Generational stewardship and civilisational continuity",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/principles.ts", "pillow/src/digital-soul/decision-record.ts"],
    "Stewardship/continuity/institutional memory principles + persistent decision history",
  ),
  sectionReq(
    "S23",
    "Constitutional amendment, interpretation, perpetual governance",
    "Implemented",
    [...CONSTITUTION, "pillow/src/digital-soul/priority.ts", "pillow/src/digital-soul/principles.ts"],
    "Amendment requires Grand King; hierarchy and fidelity principles in runtime priority/principles",
  ),
  sectionReq(
    "A",
    "Appendix A — implementation directive: repository-first, preservation, runtime, matrix, testing, no empty shells",
    "Implemented",
    [
      ...CONSTITUTION,
      "pillow/src/digital-soul/",
      "docs/governance/digital-soul/CONSTITUTIONAL_REQUIREMENT_MATRIX.md",
      "docs/audits/digital-soul/DIGITAL_SOUL_V2_IMPLEMENTATION_REPORT.md",
    ],
    "Appendix A directives satisfied by runtime module, matrix, tests, and evidence-backed report",
  ),
];

export function summarizeRequirementMatrix(): {
  total: number;
  byStatus: Record<string, number>;
  sectionsCovered: DigitalSoulSectionId[];
} {
  const byStatus: Record<string, number> = {};
  const sections = new Set<DigitalSoulSectionId>();
  for (const req of CONSTITUTIONAL_REQUIREMENT_MATRIX) {
    byStatus[req.status] = (byStatus[req.status] ?? 0) + 1;
    sections.add(req.section);
  }
  return {
    total: CONSTITUTIONAL_REQUIREMENT_MATRIX.length,
    byStatus,
    sectionsCovered: [...sections].sort(),
  };
}
