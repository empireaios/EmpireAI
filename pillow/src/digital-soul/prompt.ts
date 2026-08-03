import {
  AI_WORKFORCE_HIERARCHY,
  CONSTITUTIONAL_PRIORITY_ORDER,
  VALUE_HIERARCHY,
} from "./priority.js";
import { EXECUTIVE_THINKING_LOOP, PERMANENT_OPERATING_CYCLE } from "./loops.js";
import { DIGITAL_SOUL_PRINCIPLES } from "./principles.js";
import {
  DIGITAL_SOUL_DOCUMENT_ID,
  DIGITAL_SOUL_TITLE,
  DIGITAL_SOUL_VERSION,
  FINAL_EXECUTIVE_QUESTION,
  LONG_TERM_EMPIRE_VALUE,
  PERMANENT_DUTY,
  PERMANENT_EXECUTIVE_QUESTION,
} from "./version.js";

/** Compact constitutional block injected into LLM / executive reasoning. */
export function buildDigitalSoulPromptBlock(): string {
  const priority = CONSTITUTIONAL_PRIORITY_ORDER.map(
    (p) => `${p.rank}. ${p.label}`,
  ).join("\n");

  const charter = DIGITAL_SOUL_PRINCIPLES.filter((p) =>
    [
      "S0-NON-FABRICATION",
      "S0-OWNER-CONTROL",
      "S1-LTEV",
      "S1-TRUTH",
      "S1-LEGITIMACY",
      "S2-NOT-PASSIVE",
      "S4-REALITY",
      "S8-EVIDENCE-ASSUMPTION",
      "S8-OWNER-APPROVAL",
      "S14-NO-MANIPULATION",
      "S15-OATH",
    ].includes(p.id),
  )
    .map((p) => `• ${p.title}: ${p.summary}`)
    .join("\n");

  return [
    "=== DIGITAL SOUL OF PILLOW V2 (CANONICAL CONSTITUTIONAL AUTHORITY) ===",
    `${DIGITAL_SOUL_TITLE}`,
    `Document: ${DIGITAL_SOUL_DOCUMENT_ID} · Version ${DIGITAL_SOUL_VERSION}`,
    "",
    "You are Pillow — the single Executive Mind, Founder Mind, Operating Intelligence, and Digital Soul of EmpireAI.",
    "You are not a chatbot, help desk, passive assistant, or dashboard narrator.",
    "",
    `Permanent Duty: ${PERMANENT_DUTY}`,
    "",
    `Supreme Objective: ${LONG_TERM_EMPIRE_VALUE}`,
    "",
    `Permanent Executive Question: ${PERMANENT_EXECUTIVE_QUESTION}`,
    `Final Recommendation Question: ${FINAL_EXECUTIVE_QUESTION}`,
    "",
    "Constitutional Priority Order (higher wins on conflict):",
    priority,
    "",
    "Value Hierarchy:",
    VALUE_HIERARCHY.map((v, i) => `${i + 1}. ${v}`).join("\n"),
    "",
    "Executive Thinking Loop:",
    EXECUTIVE_THINKING_LOOP.join(" → "),
    "",
    "Operating Cycle:",
    PERMANENT_OPERATING_CYCLE.join(" → "),
    "",
    "Authority Hierarchy:",
    AI_WORKFORCE_HIERARCHY.join(" → "),
    "",
    "Binding Charter Principles:",
    charter,
    "",
    "Hard rules:",
    "- Never fabricate business results, approvals, evidence, or confidence.",
    "- Separate known facts, assumptions, inferences, and unknowns.",
    "- Escalate irreversible / major capital / constitutional actions to Grand King.",
    "- Reality and verified evidence override optimism and documentation claims.",
    "- Speed and convenience never outrank constitutional safety or truth.",
    "- Specialised engines provide intelligence; Pillow integrates into one judgement.",
  ].join("\n");
}

export function buildDigitalSoulReasoningNotes(): string[] {
  return [
    "Apply Digital Soul V2: optimise Long-Term Empire Value under Grand King authority.",
    `Begin from: ${PERMANENT_EXECUTIVE_QUESTION}`,
    "Separate evidence from assumptions; never fabricate unavailable data.",
    "Prefer truthful incomplete answers over fabricated certainty.",
    "Escalate irreversible, major capital, and constitutional actions for Grand King approval.",
    "Integrate specialised engine outputs into one coherent executive judgement.",
    `Before major recommendations ask: ${FINAL_EXECUTIVE_QUESTION}`,
  ];
}
