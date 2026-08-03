import type {
  ConfidenceLevel,
  ConstitutionalComplianceResult,
  EvidenceAssumptionSeparation,
} from "./types.js";
import { detectConstitutionalIntent } from "./constitutional-intent.js";

export type ComplianceInput = {
  recommendation?: string;
  evidence?: string[];
  assumptions?: string[];
  inferences?: string[];
  unknowns?: string[];
  confidence?: ConfidenceLevel;
  expectedEmpireValue?: string;
  risks?: string[];
  alternatives?: string[];
  irreversible?: boolean;
  majorCapital?: boolean;
  constitutionalChange?: boolean;
  ownershipChange?: boolean;
  claimsProductionHealth?: boolean;
  claimsApproval?: boolean;
  fabricatedSignals?: string[];
};

function asList(values: string[] | undefined): string[] {
  return (values ?? []).map((v) => v.trim()).filter(Boolean);
}

export function separateEvidenceAndAssumptions(
  input: ComplianceInput,
): EvidenceAssumptionSeparation {
  return {
    knownFacts: asList(input.evidence),
    assumptions: asList(input.assumptions),
    inferences: asList(input.inferences),
    unknowns: asList(input.unknowns),
    confidence: input.confidence ?? "Exploratory",
  };
}

/**
 * Constitutional compliance check against Digital Soul V2 hard rules.
 * Production-safe: returns structured findings; never throws on incomplete input.
 *
 * Free-text recommendations are interpreted for constitutional governance intent
 * (bypass / secrecy / fabricated authorisation) before structured flag evaluation.
 * Structured flags remain authoritative and are never weakened.
 */
export function evaluateConstitutionalCompliance(
  input: ComplianceInput = {},
): ConstitutionalComplianceResult {
  const separation = separateEvidenceAndAssumptions(input);
  const findings: ConstitutionalComplianceResult["findings"] = [];

  // ── Constitutional intent (free-text) — interpret before structured scoring ──
  const intent = detectConstitutionalIntent(input.recommendation);
  if (intent.detected) {
    for (const match of intent.matches) {
      findings.push({
        principleId: match.principleId,
        severity: "violation",
        message: `${match.rationale} (${match.familyId}). Treat as constitutional governance request requiring Grand King approval.`,
      });
    }
  }

  if (!input.recommendation?.trim()) {
    findings.push({
      principleId: "S8-DECISION",
      severity: "warning",
      message: "No recommendation text provided for compliance evaluation.",
    });
  }

  if (separation.knownFacts.length === 0 && input.recommendation?.trim() && !intent.detected) {
    findings.push({
      principleId: "S8-EVIDENCE-ASSUMPTION",
      severity: "warning",
      message: "Recommendation lacks explicit evidence; disclose incompleteness.",
    });
  }

  if (
    separation.assumptions.length === 0 &&
    separation.knownFacts.length > 0 &&
    input.recommendation?.trim()
  ) {
    findings.push({
      principleId: "S8-EVIDENCE-ASSUMPTION",
      severity: "info",
      message: "No assumptions listed — confirm none are hidden inside the recommendation.",
    });
  }

  if (!input.expectedEmpireValue?.trim() && input.recommendation?.trim() && !intent.detected) {
    findings.push({
      principleId: "S1-LTEV",
      severity: "warning",
      message: "Expected Long-Term Empire Value not stated.",
    });
  }

  if ((!input.alternatives || input.alternatives.length === 0) && input.recommendation?.trim()) {
    findings.push({
      principleId: "S8-ALTERNATIVES",
      severity: "info",
      message: "No alternatives considered — evaluate maintain / delay / experiment paths when practical.",
    });
  }

  if (input.fabricatedSignals && input.fabricatedSignals.length > 0) {
    findings.push({
      principleId: "S0-NON-FABRICATION",
      severity: "violation",
      message: `Fabrication signals detected: ${input.fabricatedSignals.join(", ")}`,
    });
  }

  if (input.claimsApproval && !input.constitutionalChange) {
    findings.push({
      principleId: "S0-NON-FABRICATION",
      severity: intent.detected ? "violation" : "warning",
      message:
        "Approval claim present — verify Grand King approval artifact before treating as authorised.",
    });
  }

  if (input.claimsProductionHealth && separation.knownFacts.length === 0) {
    findings.push({
      principleId: "S4-REALITY",
      severity: "violation",
      message: "Production health claimed without verified evidence.",
    });
  }

  const requiresGrandKingApproval = Boolean(
    input.irreversible ||
      input.majorCapital ||
      input.constitutionalChange ||
      input.ownershipChange ||
      intent.requiresGrandKingApproval,
  );

  if (requiresGrandKingApproval) {
    const alreadyOwnerFinding = findings.some((f) => f.principleId === "S8-OWNER-APPROVAL");
    if (!alreadyOwnerFinding) {
      findings.push({
        principleId: "S8-OWNER-APPROVAL",
        severity: intent.detected ? "violation" : "warning",
        message: intent.detected
          ? "Constitutional governance intent requires Grand King approval pack before any execution."
          : "Action requires Grand King approval pack (purpose, evidence, alternatives, risks, rollback).",
      });
    } else if (intent.detected) {
      const idx = findings.findIndex((f) => f.principleId === "S8-OWNER-APPROVAL");
      if (idx >= 0 && findings[idx]) {
        findings[idx] = {
          ...findings[idx],
          severity: "violation",
          message:
            "Constitutional governance intent requires Grand King approval pack before any execution.",
        };
      }
    }
  }

  const hasViolation = findings.some((f) => f.severity === "violation");
  const longTermEmpireValueSupported = input.expectedEmpireValue?.trim()
    ? !hasViolation
    : null;

  return {
    evaluatedAt: new Date().toISOString(),
    aligned: !hasViolation,
    longTermEmpireValueSupported,
    evidenceAssumptionSeparation: separation,
    findings,
    requiresGrandKingApproval,
    irreversibilityLevel: input.irreversible
      ? "irreversible"
      : input.majorCapital
        ? "partially_reversible"
        : input.recommendation
          ? "reversible"
          : "unknown",
  };
}
