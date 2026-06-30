import { z } from "zod";

/** Persuasive ad angle for a launch campaign. */
export type AdAngle = {
  angleId: string;
  title: string;
  hook: string;
  rationale: string;
  priority: number;
};

export const adAngleSchema = z.object({
  angleId: z.string().min(1),
  title: z.string().min(1),
  hook: z.string().min(1),
  rationale: z.string().min(1),
  priority: z.number().int().min(1),
});

/** Validates an AdAngle record shape. */
export function validateAdAngle(value: unknown): AdAngle {
  return adAngleSchema.parse(value);
}
