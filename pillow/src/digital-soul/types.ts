export type DigitalSoulSectionId =
  | "S0"
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "S6"
  | "S7"
  | "S8"
  | "S9"
  | "S10"
  | "S11"
  | "S12"
  | "S13"
  | "S14"
  | "S15"
  | "S16"
  | "S17"
  | "S18"
  | "S19"
  | "S20"
  | "S21"
  | "S22"
  | "S23"
  | "A";

export type RequirementStatus =
  | "Implemented"
  | "Strengthened"
  | "Newly Implemented"
  | "Partially Implemented"
  | "Blocked"
  | "Deferred"
  | "Not Applicable";

export type ConfidenceLevel = "High" | "Moderate" | "Low" | "Exploratory";

export type DigitalSoulPrinciple = {
  id: string;
  section: DigitalSoulSectionId;
  title: string;
  summary: string;
};

export type ConstitutionalRequirement = {
  id: string;
  section: DigitalSoulSectionId;
  requirement: string;
  status: RequirementStatus;
  implementationFiles: string[];
  runtimeBehaviour: string;
  tests: string[];
  notes?: string;
};

export type EvidenceAssumptionSeparation = {
  knownFacts: string[];
  assumptions: string[];
  inferences: string[];
  unknowns: string[];
  confidence: ConfidenceLevel;
};

export type ExecutiveDecisionRecord = {
  id: string;
  recordedAt: string;
  decision: string;
  context: string;
  evidence: string[];
  assumptions: string[];
  alternatives: string[];
  reasoning: string;
  expectedEmpireValue: string;
  expectedRisks: string[];
  confidence: ConfidenceLevel;
  approvalAuthority: string;
  recommendedBy: "Pillow";
  outcome?: string;
  lessonsLearned?: string;
  futureReviewDate?: string;
  constitutionalAlignment: boolean;
};

export type OperatingRhythmCadence = "daily" | "weekly" | "monthly" | "quarterly" | "continuous";

export type OperatingRhythmReview = {
  cadence: OperatingRhythmCadence;
  generatedAt: string;
  permanentQuestion: string;
  focusQuestions: string[];
  domainsMonitored: string[];
  signals: string[];
  recommendations: string[];
  requiredApprovals: string[];
  evidenceGaps: string[];
};

export type ConstitutionalComplianceFinding = {
  principleId: string;
  severity: "info" | "warning" | "violation";
  message: string;
};

export type ConstitutionalComplianceResult = {
  evaluatedAt: string;
  aligned: boolean;
  longTermEmpireValueSupported: boolean | null;
  evidenceAssumptionSeparation: EvidenceAssumptionSeparation;
  findings: ConstitutionalComplianceFinding[];
  requiresGrandKingApproval: boolean;
  irreversibilityLevel: "reversible" | "partially_reversible" | "irreversible" | "unknown";
};

export type DigitalSoulRuntimeSnapshot = {
  version: string;
  documentId: string;
  constitutionPresent: boolean;
  constitutionPath: string;
  principleCount: number;
  sectionCount: number;
  matrixRequirementCount: number;
  decisionRecordCount: number;
  loadedAt: string;
  productionSafe: boolean;
  limitations: string[];
};
