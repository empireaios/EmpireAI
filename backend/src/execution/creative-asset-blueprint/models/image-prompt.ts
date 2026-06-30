import { z } from "zod";

import { creativeToolSchema, type CreativeTool } from "./creative-tool.js";

/** Image generation prompt for Canva or image generation tools. */
export type ImagePrompt = {
  promptId: string;
  prompt: string;
  tool: Extract<CreativeTool, "CANVA" | "IMAGE_GENERATION">;
  aspectRatio: string;
  style: string;
};

export const imagePromptSchema = z.object({
  promptId: z.string().min(1),
  prompt: z.string().min(1),
  tool: z.enum(["CANVA", "IMAGE_GENERATION"]),
  aspectRatio: z.string().min(1),
  style: z.string().min(1),
});

/** Validates an ImagePrompt record shape. */
export function validateImagePrompt(value: unknown): ImagePrompt {
  return imagePromptSchema.parse(value);
}
