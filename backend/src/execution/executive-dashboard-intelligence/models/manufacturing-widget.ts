import { z } from "zod";

export const MANUFACTURING_STATUSES = ["IDLE", "RUNNING", "QUEUED", "BLOCKED"] as const;

export type ManufacturingStatus = (typeof MANUFACTURING_STATUSES)[number];

/** Executive dashboard manufacturing widget. */
export type ManufacturingWidget = {
  widgetId: string;
  activeLoops: number;
  completedProjects: number;
  queuedProjects: number;
  successRatePercent: number;
  averageCycleDays: number;
  status: ManufacturingStatus;
  score: number;
  summary: string;
};

export const manufacturingWidgetSchema = z.object({
  widgetId: z.string().min(1),
  activeLoops: z.number().int().min(0),
  completedProjects: z.number().int().min(0),
  queuedProjects: z.number().int().min(0),
  successRatePercent: z.number().min(0).max(100),
  averageCycleDays: z.number().min(0),
  status: z.enum(MANUFACTURING_STATUSES),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a ManufacturingWidget record shape. */
export function validateManufacturingWidget(value: unknown): ManufacturingWidget {
  return manufacturingWidgetSchema.parse(value);
}
