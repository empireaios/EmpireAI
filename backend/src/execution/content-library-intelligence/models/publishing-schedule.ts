import { z } from "zod";

/** Scheduled content publication entry — blueprint only, no live publishing. */
export type PublishingScheduleEntry = {
  entryId: string;
  contentTitle: string;
  contentType: string;
  scheduledWeek: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PLANNED";
};

export const publishingScheduleEntrySchema = z.object({
  entryId: z.string().min(1),
  contentTitle: z.string().min(1),
  contentType: z.string().min(1),
  scheduledWeek: z.number().int().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  status: z.literal("PLANNED"),
});

/** Publishing schedule for content library rollout. */
export type PublishingSchedule = {
  scheduleId: string;
  totalWeeks: number;
  entriesPerWeek: number;
  entries: PublishingScheduleEntry[];
};

export const publishingScheduleSchema = z.object({
  scheduleId: z.string().min(1),
  totalWeeks: z.number().int().min(1),
  entriesPerWeek: z.number().int().min(1),
  entries: z.array(publishingScheduleEntrySchema).min(1),
});

/** Validates a PublishingSchedule record shape. */
export function validatePublishingSchedule(value: unknown): PublishingSchedule {
  return publishingScheduleSchema.parse(value);
}
