import { z } from "zod";

import { creativeStrategySchema, type CreativeStrategy } from "./creative-strategy.js";
import { staticAdCreativeSchema, type StaticAdCreative } from "./static-ad-creative.js";
import { videoAdBlueprintSchema, type VideoAdBlueprint } from "./video-ad-blueprint.js";
import { platformAdVariantSchema, type PlatformAdVariant } from "./platform-ad-variant.js";
import { creativeScoringSchema, type CreativeScoring } from "./creative-scoring.js";
import {
  adCreativeSignalSchema,
  type AdCreativeSignal,
} from "./ad-creative-signal.js";

export type AdCreativePackageId = string;

/** Recommended primary creative reference. */
export type RecommendedPrimaryCreative = {
  type: "STATIC" | "VIDEO";
  creativeId: string;
  platform: PlatformAdVariant["platform"];
  rationale: string;
};

export const recommendedPrimaryCreativeSchema = z.object({
  type: z.enum(["STATIC", "VIDEO"]),
  creativeId: z.string().min(1),
  platform: platformAdVariantSchema.shape.platform,
  rationale: z.string().min(1),
});

/** Full ad creative package ready for Grand King review — blueprints only. */
export type AdCreativePackage = {
  packageId: AdCreativePackageId;
  brandId: string;
  storeId: string | null;
  campaignId: string | null;
  packageName: string;
  creativeStrategy: CreativeStrategy;
  staticCreatives: StaticAdCreative[];
  videoBlueprints: VideoAdBlueprint[];
  platformVariants: PlatformAdVariant[];
  creativeScoring: CreativeScoring;
  recommendedPrimaryCreative: RecommendedPrimaryCreative;
  copySummary: string;
  storyboardSummary: string;
  signals: AdCreativeSignal[];
  blueprintOnly: true;
  liveSubmissionEnabled: false;
  imageGenerationEnabled: false;
};

export type AdCreativePackageCreateInput = Omit<AdCreativePackage, "packageId">;

export const adCreativePackageSchema = z.object({
  packageId: z.string().min(1),
  brandId: z.string().min(1),
  storeId: z.string().nullable(),
  campaignId: z.string().nullable(),
  packageName: z.string().min(1),
  creativeStrategy: creativeStrategySchema,
  staticCreatives: z.array(staticAdCreativeSchema).min(1),
  videoBlueprints: z.array(videoAdBlueprintSchema).min(1),
  platformVariants: z.array(platformAdVariantSchema).min(1),
  creativeScoring: creativeScoringSchema,
  recommendedPrimaryCreative: recommendedPrimaryCreativeSchema,
  copySummary: z.string().min(1),
  storyboardSummary: z.string().min(1),
  signals: z.array(adCreativeSignalSchema),
  blueprintOnly: z.literal(true),
  liveSubmissionEnabled: z.literal(false),
  imageGenerationEnabled: z.literal(false),
});

/** Validates an AdCreativePackage record shape. */
export function validateAdCreativePackage(value: unknown): AdCreativePackage {
  return adCreativePackageSchema.parse(value);
}
