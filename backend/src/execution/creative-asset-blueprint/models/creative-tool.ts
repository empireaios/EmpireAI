import { z } from "zod";

/** Supported creative production tools for asset blueprints. */
export const CREATIVE_TOOLS = ["CANVA", "VEO", "IMAGE_GENERATION"] as const;

export type CreativeTool = (typeof CREATIVE_TOOLS)[number];

export const creativeToolSchema = z.enum(CREATIVE_TOOLS);

/** Validates a creative tool value. */
export function validateCreativeTool(value: unknown): CreativeTool {
  return creativeToolSchema.parse(value);
}

/** Display label for a creative tool. */
export function creativeToolLabel(tool: CreativeTool): string {
  const labels: Record<CreativeTool, string> = {
    CANVA: "Canva",
    VEO: "Veo",
    IMAGE_GENERATION: "Image Generation",
  };
  return labels[tool];
}
