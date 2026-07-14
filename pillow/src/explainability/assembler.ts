import type {
  ExplainabilityArchitecture,
  ExplainabilityClassification,
  ExplainabilityConfidence,
  ExplainabilityEvidence,
  ExplainabilityRecommendation,
  ExplainabilitySystemPanel,
} from "./types.js";

const CONSTITUTIONAL_EVIDENCE: ExplainabilityEvidence[] = [
  { kind: "vision", source: "EMPIREAI_VISION", summary: "Grand King sovereignty · production-first empire" },
  { kind: "constitution", source: "Constitution Hierarchy", summary: "Vision → Soul → CTD → Engineering Constitution" },
  { kind: "architecture", source: "Repository", summary: "Canonical architecture and governance documents" },
  { kind: "production_truth", source: "Production Mode", summary: "Browser-verified production truth" },
];

function defaultConfidence(percent = 70): ExplainabilityConfidence {
  return {
    confidencePercent: percent,
    confidenceClassification: percent >= 80 ? "high" : percent >= 60 ? "medium" : "low",
    supportingEvidence: ["Live operational snapshots", "Constitutional governance documents"],
    knownAssumptions: ["Pillow session reflects current runtime state"],
    knownUnknowns: ["External market conditions not fully modelled"],
    reevaluationConditions: ["Mission progress change", "Recovery event", "Validation outcome", "Production drift"],
  };
}

function makeRecommendation(input: {
  id: string;
  classification: ExplainabilityClassification;
  title: string;
  system: string;
  why: string;
  what: string;
  how: string;
  proof?: string;
  businessImpact?: string;
  engineeringImpact?: string;
  architectureImpact?: string;
  productionImpact?: string;
  risk?: string;
  expectedBenefit?: string;
  confidence?: ExplainabilityConfidence;
  evidence?: ExplainabilityEvidence[];
  alternativeOptions?: string[];
}): ExplainabilityRecommendation {
  const at = new Date().toISOString();
  return {
    id: input.id,
    classification: input.classification,
    title: input.title,
    system: input.system,
    why: input.why,
    what: input.what,
    how: input.how,
    proof: input.proof ?? "Constitutional evidence chain · live operational snapshots",
    businessImpact: input.businessImpact ?? "Supports empire growth objectives without hidden automation",
    engineeringImpact: input.engineeringImpact ?? "Transparent engineering coordination via Builder and Supervisor",
    architectureImpact: input.architectureImpact ?? "Maintains canonical architecture and governance alignment",
    productionImpact: input.productionImpact ?? "Production Truth validated before autonomous action",
    risk: input.risk ?? "Low when Grand King retains approval authority",
    expectedBenefit: input.expectedBenefit ?? "Grand King understands and can approve or override confidently",
    confidence: input.confidence ?? defaultConfidence(),
    evidence: [...CONSTITUTIONAL_EVIDENCE, ...(input.evidence ?? [])],
    alternativeOptions: input.alternativeOptions ?? ["Defer action", "Request additional evidence", "Override via Grand King approval"],
    computedAt: at,
  };
}

function panelFrom(
  system: string,
  status: string,
  summary: string,
  explanations: string[],
): ExplainabilitySystemPanel {
  return { system, status, summary, explanations };
}

function recommendationsFromStrings(
  items: string[],
  system: string,
  classification: ExplainabilityClassification,
  prefix: string,
): ExplainabilityRecommendation[] {
  return items.slice(0, 5).map((text, i) =>
    makeRecommendation({
      id: `${prefix}-${i}`,
      classification,
      title: text.slice(0, 80),
      system,
      why: `Constitutional ${system} analysis identified this action based on live operational evidence`,
      what: text,
      how: `${system} coordinates execution via Pillow host · Supervisor validates · Grand King approves when required`,
      proof: `Live ${system} cockpit snapshot and analysis at assembly time`,
      evidence: [{ kind: "runtime", source: system, summary: text }],
    }),
  );
}

export function assembleExplainabilityArchitecture(input: {
  supervisor?: Record<string, unknown>;
  ecc?: Record<string, unknown>;
  vie?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  builder?: Record<string, unknown>;
  recovery?: Record<string, unknown>;
  automation?: Record<string, unknown>;
  eta?: Record<string, unknown>;
  founderShell?: Record<string, unknown>;
}): ExplainabilityArchitecture {
  const supervisor = input.supervisor ?? {};
  const ecc = input.ecc ?? {};
  const vie = input.vie ?? {};
  const guardian = input.guardian ?? {};
  const builder = input.builder ?? {};
  const recovery = input.recovery ?? {};
  const automation = input.automation ?? {};
  const eta = input.eta ?? {};
  const founderShell = input.founderShell ?? {};

  const recommendations: ExplainabilityRecommendation[] = [];

  const supervisorAnalysis = (supervisor.analysis ?? {}) as { recommendations?: string[] };
  recommendations.push(
    ...recommendationsFromStrings(
      supervisorAnalysis.recommendations ?? [],
      "Supervisor",
      "engineering",
      "sup",
    ),
  );

  if (supervisor.missionHealth && supervisor.missionHealth !== "healthy") {
    recommendations.push(
      makeRecommendation({
        id: "sup-health",
        classification: "engineering",
        title: `Mission health: ${supervisor.missionHealth}`,
        system: "Supervisor",
        why: "Supervisor continuously validates mission execution health against constitutional requirements",
        what: `Current mission health is ${supervisor.missionHealth} — ${supervisor.currentMission ?? "active mission"}`,
        how: "Supervisor monitors step progress, heartbeat, recovery, and validation; surfaces explainable status to Cockpit",
        proof: String(supervisor.grandKingSummary ?? "Supervisor cockpit snapshot"),
        engineeringImpact: "May require Builder attention or recovery coordination",
        risk: String(supervisor.missionHealth).includes("critical") ? "High — mission at risk" : "Medium — attention required",
        confidence: defaultConfidence(75),
        evidence: [
          { kind: "current_mission", source: "Supervisor", summary: String(supervisor.currentStep ?? "—") },
          { kind: "validation", source: "Supervisor", summary: String(supervisor.validationStatus ?? "—") },
        ],
      }),
    );
  }

  const eccAnalysis = (ecc.analysis ?? {}) as { recommendations?: string[] };
  recommendations.push(
    ...recommendationsFromStrings(eccAnalysis.recommendations ?? [], "ECC", "strategic", "ecc"),
  );

  if (ecc.currentMission || ecc.priority) {
    recommendations.push(
      makeRecommendation({
        id: "ecc-priority",
        classification: "strategic",
        title: `Execution priority: ${ecc.currentMission ?? ecc.priority ?? "coordination"}`,
        system: "ECC",
        why: "ECC explains execution priority, scheduling, dependencies, and resource allocation constitutionally",
        what: `Current ECC focus: ${ecc.currentMission ?? "—"} · priority ${ecc.priority ?? "—"}`,
        how: "ECC coordinates Builder handoff, Supervisor timeline, and Guardian health before execution",
        proof: "ECC execution queue and coordination analysis",
        businessImpact: "Ensures highest-value missions execute in constitutional order",
        alternativeOptions: ["Reprioritize mission queue", "Defer lower-priority work"],
      }),
    );
  }

  const vieRecs = (vie.currentRecommendations ?? []) as string[];
  const vieViolations = (vie.currentViolations ?? []) as string[];
  recommendations.push(...recommendationsFromStrings(vieRecs, "VIE", "constitutional", "vie"));
  for (const violation of vieViolations.slice(0, 3)) {
    recommendations.push(
      makeRecommendation({
        id: `vie-violation-${violation.slice(0, 20)}`,
        classification: "constitutional",
        title: `Vision integrity: ${violation.slice(0, 60)}`,
        system: "VIE",
        why: "Vision Integrity Engine detects drift from Vision, Soul, CTD, and constitutional hierarchy",
        what: violation,
        how: "VIE recommends corrective action; Grand King approves architecture or mission adjustments",
        proof: String(vie.grandKingSummary ?? "VIE assessment"),
        risk: "High if unaddressed — constitutional drift",
        confidence: defaultConfidence(85),
        evidence: [
          { kind: "vision", source: "VIE", summary: String(vie.visionAlignment ?? "—") },
          { kind: "constitution", source: "VIE", summary: violation },
        ],
      }),
    );
  }

  const guardianAnalysis = (guardian.analysis ?? {}) as { recommendations?: string[]; operationalRisks?: string[] };
  recommendations.push(
    ...recommendationsFromStrings(
      guardianAnalysis.recommendations ?? [],
      "Guardian",
      "runtime",
      "guard",
    ),
  );
  for (const risk of (guardianAnalysis.operationalRisks ?? []).slice(0, 2)) {
    recommendations.push(
      makeRecommendation({
        id: `guard-risk-${risk.slice(0, 15)}`,
        classification: "production",
        title: risk.slice(0, 80),
        system: "Guardian",
        why: "Guardian monitors runtime, infrastructure, performance, and availability",
        what: risk,
        how: "Guardian surfaces operational risks with evidence; ECC and Pillow coordinate response",
        proof: `Guardian health: ${guardian.overallHealth ?? "unknown"}`,
        productionImpact: "May affect production availability or performance",
        risk: "Medium to high depending on severity",
      }),
    );
  }

  const builderAnalysis = (builder.analysis ?? {}) as { recommendations?: string[] };
  recommendations.push(
    ...recommendationsFromStrings(builderAnalysis.recommendations ?? [], "Builder", "engineering", "bld"),
  );

  const recoveryAnalysis = (recovery.analysis ?? {}) as { recommendations?: string[] };
  recommendations.push(
    ...recommendationsFromStrings(recoveryAnalysis.recommendations ?? [], "Recovery", "recovery", "rec"),
  );
  if (recovery.currentIncident && recovery.currentIncident !== "None") {
    recommendations.unshift(
      makeRecommendation({
        id: "rec-active",
        classification: "recovery",
        title: `Active recovery: ${recovery.currentIncident}`,
        system: "Recovery",
        why: "Autonomous Recovery Engine detected failure and initiated explainable recovery orchestration",
        what: String(recovery.currentIncident),
        how: "Recovery follows constitutional doctrine · logs evidence · Supervisor validates outcome",
        proof: String(recovery.grandKingSummary ?? "Recovery cockpit snapshot"),
        engineeringImpact: "Builder mission may be paused or retried",
        risk: "Medium — recovery in progress",
        confidence: defaultConfidence(80),
      }),
    );
  }

  const automationAnalysis = (automation.analysis ?? {}) as { recommendations?: string[] };
  recommendations.push(
    ...recommendationsFromStrings(
      automationAnalysis.recommendations ?? [],
      "Automation",
      "engineering",
      "auto",
    ),
  );

  if (eta.recommendedAction || eta.reason) {
    recommendations.push(
      makeRecommendation({
        id: "eta-change",
        classification: "engineering",
        title: "ETA prediction update",
        system: "ETA Engine",
        why: String(eta.reason ?? "Execution velocity or dependency change affects completion estimate"),
        what: String(eta.recommendedAction ?? "Review updated ETA"),
        how: "ETA Engine recalculates from progress, velocity, recovery, validation, and repository activity",
        proof: `Confidence ${eta.confidencePercent ?? "—"}% · ${eta.lastEtaUpdate ?? "live"}`,
        engineeringImpact: "Adjusts mission scheduling expectations",
        confidence: defaultConfidence(Number(eta.confidencePercent) || 70),
        evidence: [{ kind: "historical", source: "ETA Engine", summary: "Mission progress and velocity evidence" }],
      }),
    );
  }

  const shellRecs = ((founderShell.executiveHome as Record<string, unknown>)?.recommendations ??
    []) as string[];
  recommendations.push(
    ...recommendationsFromStrings(shellRecs, "Pillow", "strategic", "pillow").map((r) => ({
      ...r,
      classification: "strategic" as const,
    })),
  );

  const unique = recommendations.filter(
    (r, i, arr) => arr.findIndex((x) => x.title === r.title && x.system === r.system) === i,
  );

  const currentRecommendation = unique[0] ?? null;

  const supervisorExplanations = [
    String(supervisor.grandKingSummary ?? "Supervisor validates mission health and execution"),
    `Progress: ${supervisor.progress ?? "—"} · Step: ${supervisor.currentStep ?? "—"}`,
    `Recovery: ${supervisor.recoveryStatus ?? "—"} · Validation: ${supervisor.validationStatus ?? "—"}`,
    ...(supervisorAnalysis.recommendations ?? []).slice(0, 2),
  ];

  return {
    architectureVersion: "P7-07",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      String(founderShell.grandKingSummary ?? supervisor.grandKingSummary ?? vie.grandKingSummary) ||
      "Every recommendation is constitutionally explainable — WHY · WHAT · HOW · PROOF",
    currentRecommendation,
    recommendations: unique.slice(0, 20),
    systemsCovered: [
      "Pillow",
      "Mission Generation",
      "Builder",
      "Supervisor",
      "Guardian",
      "ECC",
      "VIE",
      "Automation",
      "Recovery",
      "Business Intelligence",
      "Commerce Intelligence",
      "Production Decisions",
      "Architecture Decisions",
    ],
    pillow: panelFrom(
      "Pillow",
      "active",
      String(founderShell.grandKingSummary ?? "Executive intelligence with explain-before-acting"),
      shellRecs.slice(0, 4),
    ),
    ecc: panelFrom(
      "ECC",
      String(ecc.executionState ?? "coordinating"),
      String(ecc.grandKingSummary ?? "Execution coordination and mission ordering"),
      (eccAnalysis.recommendations ?? []).slice(0, 4),
    ),
    supervisor: panelFrom(
      "Supervisor",
      String(supervisor.missionHealth ?? "monitoring"),
      String(supervisor.grandKingSummary ?? "Mission health and execution validation"),
      supervisorExplanations,
    ),
    builder: panelFrom(
      "Builder",
      String(builder.executionHealth ?? builder.missionState ?? "standby"),
      String(builder.grandKingSummary ?? "Engineering execution via Cursor Bridge"),
      ((builder.analysis as { recommendations?: string[] })?.recommendations ?? []).slice(0, 4),
    ),
    guardian: panelFrom(
      "Guardian",
      String(guardian.overallHealth ?? "monitoring"),
      `Runtime ${guardian.runtimeHealth ?? "—"} · ${guardian.openAlerts ?? 0} alerts`,
      ((guardian.analysis as { recommendations?: string[] })?.recommendations ?? []).slice(0, 4),
    ),
    vie: panelFrom(
      "VIE",
      String(vie.visionAlignment ?? "assessing"),
      String(vie.grandKingSummary ?? "Vision · Soul · CTD alignment"),
      [...vieRecs, ...vieViolations].slice(0, 4),
    ),
    recovery: panelFrom(
      "Recovery",
      recovery.currentIncident && recovery.currentIncident !== "None" ? "active" : "standby",
      String(recovery.grandKingSummary ?? "Autonomous recovery with explainable doctrine"),
      ((recovery.analysis as { recommendations?: string[] })?.recommendations ?? []).slice(0, 4),
    ),
    automation: panelFrom(
      "Automation",
      String(automation.automationState ?? "governed"),
      String(automation.grandKingSummary ?? "Zero-human automation with logged decisions"),
      ((automation.analysis as { recommendations?: string[] })?.recommendations ?? []).slice(0, 4),
    ),
  };
}

export function buildFallbackExplainabilityArchitecture(): ExplainabilityArchitecture {
  return assembleExplainabilityArchitecture({
    founderShell: {
      grandKingSummary: "Start Pillow session for live constitutional explainability across all systems",
      executiveHome: { recommendations: ["Open Explainability panel when Pillow is running"] },
    },
  });
}
