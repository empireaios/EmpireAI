import { randomUUID } from "node:crypto";

import type { SignalEvidence, SignalEvidenceInput } from "../models/signal-evidence.js";
import {
  parseSignalSource,
  SIGNAL_SOURCE_RELIABILITY,
  type SignalSource,
} from "../models/signal-source.js";
import type { GlobalProductSignalCreateInput } from "../models/product-signal.js";

export type RawProductSignalInput = {
  productId: string;
  source: string | SignalSource;
  timestamp?: string;
  strength?: number;
  evidence?: SignalEvidenceInput[];
  metadata?: Record<string, unknown>;
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeEvidence(items: SignalEvidenceInput[] = []): SignalEvidence[] {
  return items.map((item) => ({
    evidenceId: item.evidenceId ?? randomUUID(),
    kind: item.kind.trim(),
    summary: item.summary.trim(),
    value: item.value.trim(),
    capturedAt: item.capturedAt ?? nowIso(),
    sourceRef: item.sourceRef,
  }));
}

function normalizeSource(source: string | SignalSource): SignalSource {
  if (typeof source !== "string") return source;
  const parsed = parseSignalSource(source);
  if (!parsed) {
    throw new Error(`Unsupported signal source: ${source}`);
  }
  return parsed;
}

function normalizeStrength(rawStrength: number | undefined, evidenceCount: number): number {
  if (rawStrength !== undefined) {
    return clampScore(rawStrength);
  }
  return clampScore(35 + evidenceCount * 15);
}

/** Computes confidence from source reliability, strength, and evidence volume. */
export function computeSignalConfidence(
  source: SignalSource,
  strength: number,
  evidenceCount: number,
): number {
  const sourceReliability = SIGNAL_SOURCE_RELIABILITY[source];
  const evidenceBoost = Math.min(20, evidenceCount * 5);
  return clampScore(sourceReliability * 0.45 + strength * 0.4 + evidenceBoost);
}

/** Normalizes raw external signal input into a registry create payload. */
export function normalizeProductSignalInput(raw: RawProductSignalInput): GlobalProductSignalCreateInput {
  const source = normalizeSource(raw.source);
  const evidence = normalizeEvidence(raw.evidence);
  const strength = normalizeStrength(raw.strength, evidence.length);
  const confidence = computeSignalConfidence(source, strength, evidence.length);

  return {
    productId: raw.productId.trim(),
    source,
    timestamp: raw.timestamp,
    strength,
    confidence,
    evidence,
    metadata: raw.metadata ?? {},
  };
}

export const signalNormalization = {
  normalizeProductSignalInput,
  computeSignalConfidence,
  normalizeSource,
  normalizeEvidence,
};
