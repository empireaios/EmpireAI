import { z } from "zod";

export const INGESTION_RESULT_STATUSES = ["SUCCESS", "REJECTED"] as const;
export type IngestionResultStatus = (typeof INGESTION_RESULT_STATUSES)[number];

export const INGESTION_REJECTION_REASONS = [
  "UNKNOWN_CONNECTOR",
  "INACTIVE_CONNECTOR",
  "UNHEALTHY_CONNECTOR",
  "INVALID_EVENT",
] as const;

export type IngestionRejectionReason = (typeof INGESTION_REJECTION_REASONS)[number];

/** Outcome of a connector signal ingestion attempt. */
export type ConnectorIngestionResult = {
  resultId: string;
  eventId: string;
  workspaceId: string;
  connectorId: string;
  status: IngestionResultStatus;
  reason: string;
  signalId: string | null;
  createdAt: string;
};

export type ConnectorIngestionResultCreateInput = {
  eventId: string;
  workspaceId: string;
  connectorId: string;
  status: IngestionResultStatus;
  reason: string;
  signalId?: string | null;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const connectorIngestionResultSchema = z.object({
  resultId: z.string().min(1),
  eventId: z.string().min(1),
  workspaceId: z.string().min(1),
  connectorId: z.string().min(1),
  status: z.enum(INGESTION_RESULT_STATUSES),
  reason: z.string().min(1),
  signalId: z.string().nullable(),
  createdAt: isoTimestamp,
});

/** Validates a ConnectorIngestionResult record shape. */
export function validateConnectorIngestionResult(value: unknown): ConnectorIngestionResult {
  return connectorIngestionResultSchema.parse(value);
}
