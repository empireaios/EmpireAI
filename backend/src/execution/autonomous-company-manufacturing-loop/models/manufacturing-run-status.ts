import { z } from "zod";

/** Lifecycle status for an autonomous company manufacturing run. */
export const MANUFACTURING_RUN_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETE",
  "PARTIAL",
  "FAILED",
] as const;

export type ManufacturingRunStatus = (typeof MANUFACTURING_RUN_STATUSES)[number];

export const manufacturingRunStatusSchema = z.enum(MANUFACTURING_RUN_STATUSES);

/** Validates a manufacturing run status value. */
export function validateManufacturingRunStatus(value: unknown): ManufacturingRunStatus {
  return manufacturingRunStatusSchema.parse(value);
}

/** Display label for a manufacturing run status. */
export function manufacturingRunStatusLabel(status: ManufacturingRunStatus): string {
  const labels: Record<ManufacturingRunStatus, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETE: "Complete",
    PARTIAL: "Partial",
    FAILED: "Failed",
  };
  return labels[status];
}
