import { z } from "zod";

export const DEPLOYMENT_LOG_LEVELS = ["INFO", "WARN", "ERROR", "SUCCESS"] as const;

export type DeploymentLogLevel = (typeof DEPLOYMENT_LOG_LEVELS)[number];

export type DeploymentLogEntry = {
  logId: string;
  deploymentId: string;
  level: DeploymentLogLevel;
  phase: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export const deploymentLogEntrySchema = z.object({
  logId: z.string().min(1),
  deploymentId: z.string().min(1),
  level: z.enum(DEPLOYMENT_LOG_LEVELS),
  phase: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.unknown()),
  createdAt: z.string().datetime({ offset: true }),
});

export function validateDeploymentLogEntry(value: unknown): DeploymentLogEntry {
  return deploymentLogEntrySchema.parse(value);
}
