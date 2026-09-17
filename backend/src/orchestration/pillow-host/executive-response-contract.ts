/**
 * Typed exact-line / exact-field response contracts.
 * LLM is not final authority for deterministic totals, mode, Birth, or authorization.
 */
import {
  canonicalOperatingProjection,
  extractSuppliedContributionFacts,
  formatUsdContribution,
  isSuppliedContributionAggregationAsk,
  sumSuppliedContributionsUsd,
} from "./executive-fact-precedence.js";

export type ExactLineField =
  | { kind: "checkpoint_token"; value: string }
  | { kind: "total_synthetic_contribution"; valueUsd: number }
  | { kind: "operating_state_birth"; mode: "SYNTHETIC"; birth: "NOT_BORN" }
  | { kind: "real_commerce_authority"; value: "unauthorized" }
  | { kind: "literal_line"; value: string };

export type ExactLineResponseContract = {
  detected: true;
  expectedLineCount: number;
  fields: ExactLineField[];
  requiredToken: string | null;
  prohibitsExtraProse: boolean;
};

export type ResponseContractProjection =
  | {
      ok: true;
      message: string;
      kind: "response_contract";
      lineCount: number;
      totalSyntheticContributionUsd: number | null;
      checkpointToken: string | null;
      sellingPriceInvoked: false;
      source: "typed_response_contract";
    }
  | {
      ok: false;
      message: string;
      kind: "response_contract_blocked";
      code: "PILLOW_RESPONSE_CONTRACT_BLOCKED";
      reason: string;
    }
  | { ok: false; detected: false };

function extractCheckpointToken(message: string): string | null {
  const t = String(message || "");
  const m =
    /Checkpoint\s+token\s*[:=]\s*([A-Z0-9][A-Z0-9_-]{2,64})/i.exec(t) ||
    /\btoken\s*[:=]\s*([A-Z0-9][A-Z0-9_-]{2,64})/i.exec(t) ||
    /\b(MANGO-\d+)\b/i.exec(t);
  return m ? String(m[1]).toUpperCase() : null;
}

function detectExpectedLineCount(message: string): number | null {
  const t = String(message || "");
  const m = /\bexactly\s+(\d+)\s+lines?\b/i.exec(t);
  if (m) return Number(m[1]);
  // Implicit DC-05421-style four-field contract
  if (
    /Checkpoint\s+token/i.test(t) &&
    /Total\s+synthetic\s+contribution/i.test(t) &&
    /Operating\s+state/i.test(t) &&
    /Real-commerce\s+authority/i.test(t)
  ) {
    return 4;
  }
  return null;
}

export function parseExactLineResponseContract(
  message: string,
): ExactLineResponseContract | null {
  const t = String(message || "");
  const expectedLineCount = detectExpectedLineCount(t);
  if (expectedLineCount == null) return null;

  const token = extractCheckpointToken(t);
  const ops = canonicalOperatingProjection();
  const fields: ExactLineField[] = [];

  // Prefer explicit ordered template lines when present in the ask.
  const template = [
    { re: /Checkpoint\s+token\s*[:=]/i, kind: "checkpoint_token" as const },
    {
      re: /Total\s+synthetic\s+contribution\s*[:=]/i,
      kind: "total_synthetic_contribution" as const,
    },
    {
      re: /Operating\s+state\s*[:=]/i,
      kind: "operating_state_birth" as const,
    },
    {
      re: /Real-commerce\s+authority\s*[:=]/i,
      kind: "real_commerce_authority" as const,
    },
  ];

  const hasTemplate = template.every((x) => x.re.test(t));
  if (hasTemplate && expectedLineCount === 4) {
    fields.push(
      { kind: "checkpoint_token", value: token || "MISSING_TOKEN" },
      {
        kind: "total_synthetic_contribution",
        valueUsd: NaN, // filled at project time
      },
      {
        kind: "operating_state_birth",
        mode: ops.operatingMode,
        birth: ops.birthStatus,
      },
      {
        kind: "real_commerce_authority",
        value: ops.realCommerceAuthorityLabel,
      },
    );
  } else {
    // Generic: require token + total when aggregation ask; still bind mode/authority from B.
    if (token) fields.push({ kind: "checkpoint_token", value: token });
    if (isSuppliedContributionAggregationAsk(t) || /total\s+synthetic\s+contribution/i.test(t)) {
      fields.push({ kind: "total_synthetic_contribution", valueUsd: NaN });
    }
    fields.push(
      {
        kind: "operating_state_birth",
        mode: ops.operatingMode,
        birth: ops.birthStatus,
      },
      {
        kind: "real_commerce_authority",
        value: ops.realCommerceAuthorityLabel,
      },
    );
  }

  if (fields.length !== expectedLineCount && hasTemplate) {
    // Keep detected; projector will block on mismatch.
  }

  return {
    detected: true,
    expectedLineCount,
    fields: hasTemplate
      ? [
          { kind: "checkpoint_token", value: token || "MISSING_TOKEN" },
          { kind: "total_synthetic_contribution", valueUsd: NaN },
          {
            kind: "operating_state_birth",
            mode: ops.operatingMode,
            birth: ops.birthStatus,
          },
          {
            kind: "real_commerce_authority",
            value: ops.realCommerceAuthorityLabel,
          },
        ]
      : fields,
    requiredToken: token,
    prohibitsExtraProse: true,
  };
}

function renderLine(field: ExactLineField, totalUsd: number | null): string | null {
  switch (field.kind) {
    case "checkpoint_token":
      if (!field.value || field.value === "MISSING_TOKEN") return null;
      return `Checkpoint token: ${field.value}`;
    case "total_synthetic_contribution":
      if (totalUsd == null || !Number.isFinite(totalUsd)) return null;
      return `Total synthetic contribution: ${formatUsdContribution(totalUsd)}`;
    case "operating_state_birth":
      return `Operating state: ${field.mode}; Birth status ${field.birth}`;
    case "real_commerce_authority":
      return `Real-commerce authority: ${field.value}`;
    case "literal_line":
      return field.value;
    default:
      return null;
  }
}

/**
 * Project a typed exact-line contract from A+B+C facts. Never invents selling price.
 */
export function projectExactLineResponseContract(
  message: string,
): ResponseContractProjection {
  const t = String(message || "");
  // Candidate-evaluation exact answers are owned by Shadow CEO request-control path.
  // Do not hijack them into checkpoint-token contracts (colon optional in the ask).
  if (
    /\bEligible\s+candidates\b/i.test(t) &&
    /\bCandidate\s+selected\b/i.test(t)
  ) {
    return { ok: false, detected: false };
  }
  // "Exactly N lines" alone is not a checkpoint contract without token/total template.
  if (
    /\bexactly\s+\d+\s+lines?\b/i.test(t) &&
    !/Checkpoint\s+token/i.test(t) &&
    !/Total\s+synthetic\s+contribution/i.test(t)
  ) {
    return { ok: false, detected: false };
  }

  const contract = parseExactLineResponseContract(message);
  if (!contract) return { ok: false, detected: false };

  const facts = extractSuppliedContributionFacts(message);
  const total = sumSuppliedContributionsUsd(facts);
  const needsTotal = contract.fields.some((f) => f.kind === "total_synthetic_contribution");

  if (needsTotal && (total == null || facts.length === 0)) {
    return {
      ok: false,
      message: `PILLOW_RESPONSE_CONTRACT_BLOCKED: missing_supplied_contribution_facts`,
      kind: "response_contract_blocked",
      code: "PILLOW_RESPONSE_CONTRACT_BLOCKED",
      reason: "missing_supplied_contribution_facts",
    };
  }

  if (contract.requiredToken == null || !contract.requiredToken.trim()) {
    return {
      ok: false,
      message: `PILLOW_RESPONSE_CONTRACT_BLOCKED: missing_checkpoint_token`,
      kind: "response_contract_blocked",
      code: "PILLOW_RESPONSE_CONTRACT_BLOCKED",
      reason: "missing_checkpoint_token",
    };
  }

  const lines: string[] = [];
  for (const field of contract.fields) {
    const line = renderLine(field, total);
    if (!line) {
      return {
        ok: false,
        message: `PILLOW_RESPONSE_CONTRACT_BLOCKED: cannot_render_field_${field.kind}`,
        kind: "response_contract_blocked",
        code: "PILLOW_RESPONSE_CONTRACT_BLOCKED",
        reason: `cannot_render_field_${field.kind}`,
      };
    }
    lines.push(line);
  }

  if (lines.length !== contract.expectedLineCount) {
    return {
      ok: false,
      message: `PILLOW_RESPONSE_CONTRACT_BLOCKED: line_count_mismatch expected=${contract.expectedLineCount} got=${lines.length}`,
      kind: "response_contract_blocked",
      code: "PILLOW_RESPONSE_CONTRACT_BLOCKED",
      reason: "line_count_mismatch",
    };
  }

  // Structural: exactly N lines, no extra prose.
  const messageOut = lines.join("\n");
  if (messageOut.split("\n").length !== contract.expectedLineCount) {
    return {
      ok: false,
      message: `PILLOW_RESPONSE_CONTRACT_BLOCKED: newline_contamination`,
      kind: "response_contract_blocked",
      code: "PILLOW_RESPONSE_CONTRACT_BLOCKED",
      reason: "newline_contamination",
    };
  }

  return {
    ok: true,
    message: messageOut,
    kind: "response_contract",
    lineCount: lines.length,
    totalSyntheticContributionUsd: total,
    checkpointToken: contract.requiredToken,
    sellingPriceInvoked: false,
    source: "typed_response_contract",
  };
}

/** Validate a visible answer against an exact-line contract (post-processor guard). */
export function validateExactLineResponse(
  answer: string,
  userMessage: string,
): { ok: boolean; reason?: string } {
  const projected = projectExactLineResponseContract(userMessage);
  if (!projected.ok) {
    if ("detected" in projected) return { ok: true };
    return { ok: false, reason: projected.reason };
  }
  const normalized = String(answer || "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (normalized !== projected.message) {
    return { ok: false, reason: "answer_diverges_from_typed_contract" };
  }
  return { ok: true };
}
