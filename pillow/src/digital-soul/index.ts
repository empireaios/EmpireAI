export {
  DIGITAL_SOUL_VERSION,
  DIGITAL_SOUL_DOCUMENT_ID,
  DIGITAL_SOUL_CLASSIFICATION,
  DIGITAL_SOUL_TITLE,
  DIGITAL_SOUL_SUPERSEDES,
  LONG_TERM_EMPIRE_VALUE,
  PERMANENT_DUTY,
  PERMANENT_EXECUTIVE_QUESTION,
  FINAL_EXECUTIVE_QUESTION,
} from "./version.js";

export {
  DIGITAL_SOUL_CONSTITUTION_PATH,
  DIGITAL_SOUL_REQUIREMENT_MATRIX_PATH,
  DIGITAL_SOUL_IMPLEMENTATION_REPORT_PATH,
  DIGITAL_SOUL_ARCHIVE_NOTICE_PATH,
  DIGITAL_SOUL_DECISION_STORE_RELATIVE,
} from "./paths.js";

export {
  CONSTITUTIONAL_PRIORITY_ORDER,
  CONSTITUTIONAL_INTERPRETATION_HIERARCHY,
  VALUE_HIERARCHY,
  CRISIS_PRIORITY_HIERARCHY,
  AI_WORKFORCE_HIERARCHY,
} from "./priority.js";

export {
  EXECUTIVE_THINKING_LOOP,
  LEARNING_LOOP,
  OPPORTUNITY_PIPELINE,
  DECISION_CYCLE,
  KNOWLEDGE_LIFECYCLE,
  PERMANENT_OPERATING_CYCLE,
  CONTINUOUS_EXECUTIVE_CYCLE,
  REASONING_PROCESS,
  ENTERPRISE_DOMAINS,
} from "./loops.js";

export {
  DIGITAL_SOUL_SECTIONS,
  DIGITAL_SOUL_PRINCIPLES,
  getPrinciplesBySection,
  getPrincipleById,
} from "./principles.js";

export {
  buildDigitalSoulPromptBlock,
  buildDigitalSoulReasoningNotes,
} from "./prompt.js";

export {
  evaluateConstitutionalCompliance,
  separateEvidenceAndAssumptions,
  type ComplianceInput,
} from "./compliance.js";

export {
  gateExecutiveConversation,
  gateExecutiveVisibleAnswer,
  assertDigitalSoulAvailable,
  buildPillowUnavailableConstitutionalRefusal,
  DigitalSoulUnavailableError,
  ConstitutionalGateRefusedError,
  CONSTITUTIONAL_AVAILABILITY_REFUSAL,
  CONSTITUTIONAL_GATE_REFUSAL_PREFIX,
  type ExecutiveConversationGateInput,
  type ExecutiveConversationGateResult,
  type ExecutiveConversationGatePurpose,
} from "./executive-conversation-gate.js";

export {
  detectConstitutionalIntent,
  normalizeConstitutionalText,
  listConstitutionalIntentFamilyIds,
  type ConstitutionalIntentDetection,
  type ConstitutionalIntentFamilyId,
  type ConstitutionalIntentMatch,
} from "./constitutional-intent.js";

export {
  listExecutiveDecisionRecords,
  recordExecutiveDecision,
  type RecordDecisionInput,
} from "./decision-record.js";

export {
  runOperatingRhythmReview,
  describeOperatingRhythmDoctrine,
} from "./operating-rhythm.js";

export {
  CONSTITUTIONAL_REQUIREMENT_MATRIX,
  summarizeRequirementMatrix,
} from "./requirement-matrix.js";

export { DigitalSoulRuntime, createDigitalSoulRuntime } from "./engine.js";

export type {
  DigitalSoulSectionId,
  RequirementStatus,
  ConfidenceLevel,
  DigitalSoulPrinciple,
  ConstitutionalRequirement,
  EvidenceAssumptionSeparation,
  ExecutiveDecisionRecord,
  OperatingRhythmCadence,
  OperatingRhythmReview,
  ConstitutionalComplianceFinding,
  ConstitutionalComplianceResult,
  DigitalSoulRuntimeSnapshot,
} from "./types.js";
