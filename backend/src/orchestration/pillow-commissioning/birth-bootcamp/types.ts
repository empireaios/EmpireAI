/**
 * Pillow Executive Birth Bootcamp — types.
 * MOCK READY ≠ BIRTH PASS. Never authorises Birth.
 */

export type BootcampFamily =
  | "TRUTH_EVIDENCE"
  | "GOVERNANCE_AUTHORITY"
  | "EXECUTIVE_JUDGMENT"
  | "ANTI_SYCOPHANCY"
  | "STRATEGY"
  | "PROBABILITY_OF_SCALE"
  | "COST_AWARE_INTELLIGENCE"
  | "COMMERCE_EXECUTION"
  | "PORTFOLIO_CORRIDOR"
  | "PROACTIVITY"
  | "MEMORY_CONTINUITY"
  | "LEARNING"
  | "FINANCIAL_DISCIPLINE"
  | "OPERATIONAL_RESILIENCE"
  | "EXECUTIVE_COMMUNICATION";

export type BootcampLevel = 1 | 2 | 3 | 4 | 5;

export type MockReadiness =
  | "NOT_TRAINED"
  | "TRAINING"
  | "MOCK_WEAK"
  | "MOCK_READY"
  | "POST_BIRTH_EVIDENCE_REQUIRED";

export type AuditStrength =
  | "STRONG"
  | "PARTIAL"
  | "MISSING"
  | "POST_BIRTH"
  | "OWNER_DEPENDENT";

export type BootcampCheck = {
  name: string;
  pass: boolean;
  detail: string;
};

export type BootcampScenarioResult = {
  scenarioId: string;
  family: BootcampFamily;
  level: BootcampLevel;
  title: string;
  status: "PASS" | "FAIL";
  checks: BootcampCheck[];
  llmCalls: number;
  deterministic: boolean;
};

export type FamilySummary = {
  family: BootcampFamily;
  audit: AuditStrength;
  mockReadiness: MockReadiness;
  scenariosRun: number;
  passed: number;
  failed: number;
  maxLevelPassed: number;
  notes: string;
};

export type BootcampReport = {
  artifact: "PILLOW_EXECUTIVE_BIRTH_BOOTCAMP";
  computedAt: string;
  seed: number;
  birthAuthorised: false;
  birthTimestamp: null;
  realGkChatgptExamQuestionsSeen: false;
  hiddenT1T2T3Executed: false;
  results: BootcampScenarioResult[];
  families: FamilySummary[];
  cost: {
    scenariosExecuted: number;
    deterministicScenarios: number;
    llmCalls: number;
    estimatedLlmUsd: number;
    note: string;
  };
  bootcampReady: boolean;
  knownBirthCriticalSystemicFailures: number;
  safeForGkChatgptSealedExam: boolean;
};
