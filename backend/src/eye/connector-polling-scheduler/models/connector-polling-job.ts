import { z } from "zod";

export const POLLING_JOB_STATUSES = ["ACTIVE", "DISABLED"] as const;
export type PollingJobStatus = (typeof POLLING_JOB_STATUSES)[number];

/** Polling job binding a registered connector to a product observation target. */
export type ConnectorPollingJob = {
  jobId: string;
  workspaceId: string;
  connectorId: string;
  productId: string;
  status: PollingJobStatus;
  pollQuery: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ConnectorPollingJobCreateInput = {
  connectorId: string;
  productId: string;
  status?: PollingJobStatus;
  pollQuery?: Record<string, unknown>;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const connectorPollingJobSchema = z.object({
  jobId: z.string().min(1),
  workspaceId: z.string().min(1),
  connectorId: z.string().min(1),
  productId: z.string().min(1),
  status: z.enum(POLLING_JOB_STATUSES),
  pollQuery: z.record(z.unknown()),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ConnectorPollingJob record shape. */
export function validateConnectorPollingJob(value: unknown): ConnectorPollingJob {
  return connectorPollingJobSchema.parse(value);
}
