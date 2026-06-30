import { z } from "zod";

/** Frequency cap rule to prevent message fatigue. */
export type FrequencyControl = {
  controlId: string;
  channel: string;
  label: string;
  maxPerDay: number;
  maxPerWeek: number;
  minHoursBetween: number;
  promotionalCapPerWeek: number;
  score: number;
};

export const frequencyControlSchema = z.object({
  controlId: z.string().min(1),
  channel: z.string().min(1),
  label: z.string().min(1),
  maxPerDay: z.number().int().min(0),
  maxPerWeek: z.number().int().min(0),
  minHoursBetween: z.number().min(0),
  promotionalCapPerWeek: z.number().int().min(0),
  score: z.number().min(0).max(100),
});

/** Validates a FrequencyControl record shape. */
export function validateFrequencyControl(value: unknown): FrequencyControl {
  return frequencyControlSchema.parse(value);
}
