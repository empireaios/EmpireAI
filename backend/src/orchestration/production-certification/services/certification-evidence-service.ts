/**
 * G6-00 — Certification evidence redaction (never expose secrets).
 */

import type { CertificationEvidence } from "../contracts/production-certification-types.js";

const SECRET_PATTERNS = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /token/i,
  /credential/i,
  /authorization:\s*bearer/i,
  /sk_live_/i,
  /sk_test_/i,
];

export function redactCertificationEvidenceValue(key: string, value: unknown): string {
  const serialized = typeof value === "string" ? value : JSON.stringify(value ?? "");
  if (SECRET_PATTERNS.some((pattern) => pattern.test(key) || pattern.test(serialized))) {
    return "[REDACTED]";
  }
  if (serialized.length > 256) {
    return `${serialized.slice(0, 128)}…[truncated]`;
  }
  return serialized;
}

export function buildRedactedCertificationEvidence(input: {
  evidenceId: string;
  kind: CertificationEvidence["kind"];
  summary: string;
  ref?: string;
  metadata?: Record<string, unknown>;
}): CertificationEvidence {
  const metadata: Record<string, string> = {};
  if (input.metadata) {
    for (const [key, value] of Object.entries(input.metadata)) {
      metadata[key] = redactCertificationEvidenceValue(key, value);
    }
  }

  return {
    evidenceId: input.evidenceId,
    kind: input.kind,
    summary: input.summary,
    ref: input.ref,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

export function assertNoSecretsInEvidence(evidence: CertificationEvidence[]): {
  valid: boolean;
  reason: string;
} {
  for (const item of evidence) {
    if (item.summary && /sk_live_|password=/i.test(item.summary)) {
      return { valid: false, reason: `Evidence ${item.evidenceId} summary contains secret pattern` };
    }
    if (item.metadata) {
      for (const [key, value] of Object.entries(item.metadata)) {
        if (value === "[REDACTED]") continue;
        if (SECRET_PATTERNS.some((pattern) => pattern.test(key) || pattern.test(value))) {
          return {
            valid: false,
            reason: `Evidence ${item.evidenceId} metadata ${key} must be redacted`,
          };
        }
      }
    }
  }
  return { valid: true, reason: "Evidence redaction validated" };
}
