import { z } from "zod";

/** Evidence artifact supporting a global product signal. */
export type SignalEvidence = {
  evidenceId: string;
  kind: string;
  summary: string;
  value: string;
  capturedAt: string;
  sourceRef?: string;
};

export type SignalEvidenceInput = Omit<SignalEvidence, "evidenceId" | "capturedAt"> & {
  evidenceId?: string;
  capturedAt?: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const signalEvidenceSchema = z.object({
  evidenceId: z.string().min(1),
  kind: z.string().min(1),
  summary: z.string().min(1),
  value: z.string().min(1),
  capturedAt: isoTimestamp,
  sourceRef: z.string().optional(),
});

/** Validates a SignalEvidence record shape. */
export function validateSignalEvidence(value: unknown): SignalEvidence {
  return signalEvidenceSchema.parse(value);
}
