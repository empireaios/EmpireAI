/**
 * Certification streak + executive capability state.
 * Historical PASS ≠ current clean certification streak.
 */
export type CapabilityStatus =
  | "implemented"
  | "historically_tested"
  | "current_certified"
  | "regressed"
  | "unknown";

export type ExecutiveCapabilityRecord = {
  id: string;
  status: CapabilityStatus;
  lessons: string[];
  regressionRefs: string[];
  lastPassSha: string | null;
  lastPassAt: string | null;
  currentStreak: number;
  knownDefects: string[];
};

export type CertificationStreakState = {
  waveId: string;
  historicalEvidencePass: boolean;
  currentCertificationStreak: number;
  lastFailureAt: string | null;
  lastFailureClass: string | null;
  candidateSha: string | null;
  status: "RESET" | "IN_PROGRESS" | "CERTIFIED" | "NOT_CERTIFIED";
};

const DEFAULT_CAPABILITIES: ExecutiveCapabilityRecord[] = [
  {
    id: "evidence_discipline",
    status: "historically_tested",
    lessons: ["birth.lesson.estimate_ne_realised", "birth.lesson.evidence_ne_authority_route"],
    regressionRefs: ["cr.evidence_ne_delegation"],
    lastPassSha: null,
    lastPassAt: null,
    currentStreak: 0,
    knownDefects: [],
  },
  {
    id: "authority_delegation",
    status: "historically_tested",
    lessons: ["birth.lesson.auth_ne_capability", "birth.lesson.newer_owner_wins"],
    regressionRefs: ["cr.authority_ne_claim_audit"],
    lastPassSha: null,
    lastPassAt: null,
    currentStreak: 0,
    knownDefects: [],
  },
  {
    id: "synthetic_isolation",
    status: "historically_tested",
    lessons: ["birth.lesson.synthetic_isolation"],
    regressionRefs: ["cr.synthetic_isolation"],
    lastPassSha: null,
    lastPassAt: null,
    currentStreak: 0,
    knownDefects: [],
  },
  {
    id: "decision_constraints",
    status: "historically_tested",
    lessons: ["birth.lesson.partial_gate_ne_full_unlock"],
    regressionRefs: ["cr.partial_gate"],
    lastPassSha: null,
    lastPassAt: null,
    currentStreak: 0,
    knownDefects: [],
  },
  {
    id: "accepted_request_reliability",
    status: "historically_tested",
    lessons: ["birth.lesson.accepted_request_server_owned"],
    regressionRefs: ["cr.no_ask_again"],
    lastPassSha: null,
    lastPassAt: null,
    currentStreak: 0,
    knownDefects: [],
  },
  {
    id: "compositional_routing",
    status: "implemented",
    lessons: ["birth.lesson.evidence_ne_authority_route"],
    regressionRefs: ["cr.evidence_ne_delegation", "cr.authority_ne_claim_audit"],
    lastPassSha: null,
    lastPassAt: null,
    currentStreak: 0,
    knownDefects: [],
  },
];

/** Material failure resets current streak to zero; historical evidence retained separately. */
export function recordMaterialFailure(
  state: CertificationStreakState,
  failureClass: string,
  at: string = new Date().toISOString(),
): CertificationStreakState {
  return {
    ...state,
    currentCertificationStreak: 0,
    lastFailureAt: at,
    lastFailureClass: failureClass,
    status: "RESET",
    candidateSha: null,
  };
}

export function recordCleanPass(
  state: CertificationStreakState,
  sha: string,
  at: string = new Date().toISOString(),
): CertificationStreakState {
  const next = state.currentCertificationStreak + 1;
  return {
    ...state,
    currentCertificationStreak: next,
    candidateSha: sha,
    status: "IN_PROGRESS",
    lastFailureAt: state.lastFailureAt,
    lastFailureClass: state.lastFailureClass,
  };
}

/** Conservative change-impact: which capabilities a path touch may invalidate. */
export function capabilitiesInvalidatedByPaths(paths: string[]): string[] {
  const out = new Set<string>();
  for (const p of paths) {
    const x = p.replace(/\\/g, "/").toLowerCase();
    if (x.includes("authority-semantics") || x.includes("task-contract")) {
      out.add("authority_delegation");
      out.add("compositional_routing");
      out.add("evidence_discipline");
    }
    if (x.includes("scoped-reasoning") || x.includes("epistemic")) {
      out.add("evidence_discipline");
      out.add("synthetic_isolation");
    }
    if (x.includes("decision-constraint") || x.includes("decision-gate")) {
      out.add("decision_constraints");
    }
    if (x.includes("accepted-request") || x.includes("tier0")) {
      out.add("accepted_request_reliability");
    }
    if (x.includes("executive-learning") || x.includes("birth-executive-lesson")) {
      out.add("compositional_routing");
      out.add("evidence_discipline");
      out.add("authority_delegation");
    }
  }
  return [...out];
}

export function defaultWaveCertificationStates(): CertificationStreakState[] {
  return [
    {
      waveId: "WAVE_1",
      historicalEvidencePass: true,
      currentCertificationStreak: 0,
      lastFailureAt: new Date().toISOString(),
      lastFailureClass: "post_closure_stress_audit_fail",
      candidateSha: null,
      status: "RESET",
    },
    {
      waveId: "WAVE_2",
      historicalEvidencePass: true,
      currentCertificationStreak: 0,
      lastFailureAt: null,
      lastFailureClass: null,
      candidateSha: null,
      status: "NOT_CERTIFIED",
    },
  ];
}

export function getExecutiveCapabilityState(): {
  capabilities: ExecutiveCapabilityRecord[];
  waves: CertificationStreakState[];
  schemaVersion: string;
} {
  return {
    capabilities: DEFAULT_CAPABILITIES.map((c) => ({ ...c })),
    waves: defaultWaveCertificationStates(),
    schemaVersion: "birth-foundation-1",
  };
}

/** 10× gauntlet framework descriptor — scenarios generated at certification time. */
export function describeTenXGauntletFramework(): {
  version: string;
  dimensions: string[];
  rule: string;
} {
  return {
    version: "gauntlet-framework-1",
    dimensions: [
      "context_length",
      "obligation_count",
      "cross_domain_composition",
      "conflicting_evidence",
      "temporal_changes",
      "nested_conditions",
      "decision_gates",
      "authority_changes",
      "unknowns",
      "sequence_dependencies",
      "recovery_pressure",
      "memory_retrieval",
    ],
    rule: "Any material failure resets current Wave certification streak to zero. Historical evidence retained.",
  };
}
