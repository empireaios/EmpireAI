import { z } from "zod";

export const POLLING_RESULT_STATUSES = ["SUCCESS", "FAILED", "SKIPPED"] as const;
export type PollingResultStatus = (typeof POLLING_RESULT_STATUSES)[number];

/** Outcome of a connector polling execution. */
export type ConnectorPollingResult = {
  resultId: string;
  jobId: string;
  scheduleId: string;
  workspaceId: string;
  connectorId: string;
  status: PollingResultStatus;
  reason: string;
  ingestionResultId: string | null;
  signalId: string | null;
  durationMs: number;
  polledAt: string;
};

export type ConnectorPollingResultCreateInput = {
  jobId: string;
  scheduleId: string;
  connectorId: string;
  status: PollingResultStatus;
  reason: string;
  ingestionResultId?: string | null;
  signalId?: string | null;
  durationMs: number;
  polledAt?: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const connectorPollingResultSchema = z.object({
  resultId: z.string().min(1),
  jobId: z.string().min(1),
  scheduleId: z.string().min(1),
  workspaceId: z.string().min(1),
  connectorId: z.string().min(1),
  status: z.enum(POLLING_RESULT_STATUSES),
  reason: z.string().min(1),
  ingestionResultId: z.string().nullable(),
  signalId: z.string().nullable(),
  durationMs: z.number().min(0),
  polledAt: isoTimestamp,
});

/** Validates a ConnectorPollingResult record shape. */
export function validateConnectorPollingResult(value: unknown): ConnectorPollingResult {
  return connectorPollingResultSchema.parse(value);
}
