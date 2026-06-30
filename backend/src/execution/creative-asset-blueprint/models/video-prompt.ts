import { z } from "zod";

/** Video generation prompt for Veo and short-form ad assets. */
export type VideoPrompt = {
  promptId: string;
  prompt: string;
  tool: "VEO";
  durationSeconds: number;
  format: string;
};

export const videoPromptSchema = z.object({
  promptId: z.string().min(1),
  prompt: z.string().min(1),
  tool: z.literal("VEO"),
  durationSeconds: z.number().int().min(1),
  format: z.string().min(1),
});

/** Validates a VideoPrompt record shape. */
export function validateVideoPrompt(value: unknown): VideoPrompt {
  return videoPromptSchema.parse(value);
}
