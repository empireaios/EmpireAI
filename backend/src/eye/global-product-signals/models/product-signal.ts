import { z } from "zod";

import { signalEvidenceSchema, type SignalEvidence } from "./signal-evidence.js";
import { SIGNAL_SOURCES, type SignalSource } from "./signal-source.js";

/** Registry record for external product intelligence evidence. */
export type GlobalProductSignal = {
  signalId: string;
  workspaceId: string;
  productId: string;
  source: SignalSource;
  timestamp: string;
  strength: number;
  confidence: number;
  evidence: SignalEvidence[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type GlobalProductSignalCreateInput = {
  productId: string;
  source: SignalSource;
  timestamp?: string;
  strength: number;
  confidence?: number;
  evidence: SignalEvidence[];
  metadata?: Record<string, unknown>;
};

export type GlobalProductSignalUpdateInput = Partial<
  Omit<GlobalProductSignalCreateInput, "productId" | "source">
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const globalProductSignalSchema = z.object({
  signalId: z.string().min(1),
  workspaceId: z.string().min(1),
  productId: z.string().min(1),
  source: z.enum(SIGNAL_SOURCES),
  timestamp: isoTimestamp,
  strength: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  evidence: z.array(signalEvidenceSchema),
  metadata: z.record(z.unknown()),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a GlobalProductSignal record shape. */
export function validateGlobalProductSignal(value: unknown): GlobalProductSignal {
  return globalProductSignalSchema.parse(value);
}

/** Alias for registry product signal records. */
export type ProductSignal = GlobalProductSignal;

export type ProductSignalCreateInput = GlobalProductSignalCreateInput;
