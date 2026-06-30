import { z } from "zod";

/** Extracted positive theme from review analysis. */
export type PositiveTheme = {
  themeId: string;
  theme: string;
  description: string;
  mentionCount: number;
  score: number;
};

export const positiveThemeSchema = z.object({
  themeId: z.string().min(1),
  theme: z.string().min(1),
  description: z.string().min(1),
  mentionCount: z.number().int().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a PositiveTheme record shape. */
export function validatePositiveTheme(value: unknown): PositiveTheme {
  return positiveThemeSchema.parse(value);
}
