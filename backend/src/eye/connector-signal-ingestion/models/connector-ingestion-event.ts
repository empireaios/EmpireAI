import { z } from "zod";

import type { SignalEvidenceInput } from "../../global-product-signals/models/signal-evidence.js";

/** Raw connector observation payload submitted for ingestion. */
export type ConnectorIngestionEventInput = {
  connectorId: string;
  productId: string;
  observedAt?: string;
  strength?: number;
  evidence: SignalEvidenceInput[];
  metadata?: Record<string, unknown>;
};

/** Normalized connector ingestion event with workspace context. */
export type ConnectorIngestionEvent = {
  eventId: string;
  workspaceId: string;
  connectorId: string;
  productId: string;
  observedAt: string;
  strength?: number;
  evidence: SignalEvidenceInput[];
  metadata: Record<string, unknown>;
};

const isoTimestamp = z.string().datetime({ offset: true });

const ingestionEvidenceSchema = z.object({
  evidenceId: z.string().optional(),
  kind: z.string().min(1),
  summary: z.string().min(1),
  value: z.string().min(1),
  capturedAt: isoTimestamp.optional(),
  sourceRef: z.string().optional(),
});

export const connectorIngestionEventSchema = z.object({
  eventId: z.string().min(1),
  workspaceId: z.string().min(1),
  connectorId: z.string().min(1),
  productId: z.string().min(1),
  observedAt: isoTimestamp,
  strength: z.number().min(0).max(100).optional(),
  evidence: z.array(ingestionEvidenceSchema).min(1),
  metadata: z.record(z.unknown()),
});

/** Validates a ConnectorIngestionEvent record shape. */
export function validateConnectorIngestionEvent(value: unknown): ConnectorIngestionEvent {
  return connectorIngestionEventSchema.parse(value);
}
