import { z } from "zod";

import { creativeAssetSignalSchema, type CreativeAssetSignal } from "./creative-asset-signal.js";
import { creativeHookSchema, type CreativeHook } from "./creative-hook.js";
import { creativeScriptSchema, type CreativeScript } from "./creative-script.js";
import { imagePromptSchema, type ImagePrompt } from "./image-prompt.js";
import { videoPromptSchema, type VideoPrompt } from "./video-prompt.js";

export type CreativeAssetBlueprintId = string;

/** Blueprint of ad creative assets ready for Canva, Veo, and image generation. */
export type CreativeAssetBlueprint = {
  blueprintId: CreativeAssetBlueprintId;
  imagePrompts: ImagePrompt[];
  videoPrompts: VideoPrompt[];
  hooks: CreativeHook[];
  scripts: CreativeScript[];
  cta: string;
  confidence: number;
  signals: CreativeAssetSignal[];
};

export type CreativeAssetBlueprintCreateInput = Omit<CreativeAssetBlueprint, "blueprintId">;

export const creativeAssetBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  imagePrompts: z.array(imagePromptSchema).min(1),
  videoPrompts: z.array(videoPromptSchema).min(1),
  hooks: z.array(creativeHookSchema).min(1),
  scripts: z.array(creativeScriptSchema).min(1),
  cta: z.string().min(1),
  confidence: z.number().min(0).max(100),
  signals: z.array(creativeAssetSignalSchema),
});

/** Validates a CreativeAssetBlueprint record shape. */
export function validateCreativeAssetBlueprint(value: unknown): CreativeAssetBlueprint {
  return creativeAssetBlueprintSchema.parse(value);
}
