import { z } from "zod";

export const VIDEO_AD_DURATIONS = [15, 30, 60] as const;

export type VideoAdDuration = (typeof VIDEO_AD_DURATIONS)[number];

export const videoAdDurationSchema = z.union([
  z.literal(15),
  z.literal(30),
  z.literal(60),
]);

/** Single scene in a video ad storyboard. */
export type VideoStoryboardScene = {
  sceneNumber: number;
  durationSeconds: number;
  visualDescription: string;
  onScreenCaption: string;
};

export const videoStoryboardSceneSchema = z.object({
  sceneNumber: z.number().int().min(1),
  durationSeconds: z.number().min(1),
  visualDescription: z.string().min(1),
  onScreenCaption: z.string().min(1),
});

/** Video ad blueprint with storyboard and voiceover. */
export type VideoAdBlueprint = {
  blueprintId: string;
  durationSeconds: VideoAdDuration;
  openingHook: string;
  storyboard: VideoStoryboardScene[];
  voiceover: string;
  onScreenCaptions: string[];
  closingCallToAction: string;
};

export const videoAdBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  durationSeconds: videoAdDurationSchema,
  openingHook: z.string().min(1),
  storyboard: z.array(videoStoryboardSceneSchema).min(1),
  voiceover: z.string().min(1),
  onScreenCaptions: z.array(z.string().min(1)).min(1),
  closingCallToAction: z.string().min(1),
});

/** Validates a VideoAdBlueprint record shape. */
export function validateVideoAdBlueprint(value: unknown): VideoAdBlueprint {
  return videoAdBlueprintSchema.parse(value);
}
