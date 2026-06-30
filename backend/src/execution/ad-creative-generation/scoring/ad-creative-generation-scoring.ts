import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { AdAngle } from "../../marketing-campaign-genesis/models/ad-angle.js";
import type { AdCreativePackageCreateInput } from "../models/ad-creative-package.js";
import type { RecommendedPrimaryCreative } from "../models/ad-creative-package.js";
import type { AdCreativeSignal, AdCreativeSignalType } from "../models/ad-creative-signal.js";
import type { CreativeScoring } from "../models/creative-scoring.js";
import type { CreativeStrategy } from "../models/creative-strategy.js";
import type {
  AdCreativePlatform,
  PlatformAdVariant,
} from "../models/platform-ad-variant.js";
import {
  AD_CREATIVE_PLATFORMS,
  adCreativePlatformLabel,
} from "../models/platform-ad-variant.js";
import type { StaticAdCreative, StaticAdFormat } from "../models/static-ad-creative.js";
import { STATIC_AD_FORMATS, staticAdFormatAspectRatio } from "../models/static-ad-creative.js";
import type { VideoAdBlueprint, VideoAdDuration } from "../models/video-ad-blueprint.js";
import { VIDEO_AD_DURATIONS } from "../models/video-ad-blueprint.js";

export const AD_CREATIVE_SIGNAL_WEIGHTS: Record<AdCreativeSignalType, number> = {
  strategy_strength: 0.2,
  static_coverage: 0.16,
  video_coverage: 0.16,
  platform_fit: 0.16,
  copy_quality: 0.14,
  scoring_composite: 0.1,
  package_composite: 0.08,
};

export type AdCreativeBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type AdCreativeOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
};

export type AdCreativeGenerationInput = {
  brand: AdCreativeBrandInput;
  offer: AdCreativeOfferInput;
  campaignName?: string;
  campaignId?: string;
  storeId?: string;
  adAngles?: Array<Pick<AdAngle, "title" | "hook">>;
};

export type AdCreativeGenerationBreakdown = AdCreativePackageCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignal(
  signalType: AdCreativeSignalType,
  score: number,
  detail: string,
): AdCreativeSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: AD_CREATIVE_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function resolveAdAngles(
  input: AdCreativeGenerationInput,
): Array<{ title: string; hook: string }> {
  if (input.adAngles?.length) {
    return input.adAngles;
  }

  return [
    { title: "Problem-solution", hook: input.offer.headline },
    { title: "Value proposition", hook: input.offer.valueProposition },
    ...input.offer.keyBenefits.slice(0, 2).map((benefit) => ({
      title: `Benefit: ${benefit.slice(0, 32)}`,
      hook: benefit,
    })),
  ];
}

function buildPackageName(brand: AdCreativeBrandInput, offer: AdCreativeOfferInput): string {
  return `${brand.brandName} — ${offer.offerTitle} Ad Creatives`;
}

/** Phase 078A — creative strategy. */
function buildCreativeStrategy(
  input: AdCreativeGenerationInput,
  angles: Array<{ title: string; hook: string }>,
): CreativeStrategy {
  const { brand, offer } = input;
  const primaryPain = `${brand.targetAudience} struggle to find reliable ${brand.niche} products they can trust.`;
  const secondaryPain = `Generic alternatives fail to deliver on ${offer.keyBenefits[0]?.toLowerCase() ?? "quality"}.`;

  return {
    primaryHook: angles[0]?.hook ?? offer.headline,
    secondaryHook: angles[1]?.hook ?? offer.valueProposition,
    emotionalAngle: `Feel confident choosing ${brand.brandName} — ${brand.slogan}`,
    rationalAngle: `${offer.valueProposition} backed by ${brand.positioning.toLowerCase()}.`,
    painPoints: [primaryPain, secondaryPain],
    desiredOutcomes: [
      `Discover a trusted ${brand.niche} solution`,
      offer.keyBenefits[0] ?? "Experience premium quality",
      `Take action: ${offer.callToAction}`,
    ],
  };
}

/** Phase 078B — static ad creative variants. */
function buildStaticCreatives(
  input: AdCreativeGenerationInput,
  strategy: CreativeStrategy,
): StaticAdCreative[] {
  const { brand, offer } = input;

  const formatCopy: Record<
    StaticAdFormat,
    { headline: string; primaryText: string; description: string; visualBrief: string }
  > = {
    SQUARE: {
      headline: offer.headline.slice(0, 40),
      primaryText: `${strategy.primaryHook} ${strategy.emotionalAngle}`,
      description: offer.valueProposition,
      visualBrief: `Square ${staticAdFormatAspectRatio("SQUARE")} hero shot of ${offer.offerTitle}, bold headline overlay, ${brand.brandName} logo, clean ${brand.niche} background.`,
    },
    PORTRAIT: {
      headline: strategy.primaryHook.slice(0, 50),
      primaryText: `${strategy.rationalAngle} ${offer.keyBenefits[0] ?? ""}`.trim(),
      description: brand.slogan,
      visualBrief: `Portrait ${staticAdFormatAspectRatio("PORTRAIT")} lifestyle scene with ${brand.targetAudience} using ${offer.offerTitle}, text-safe top third for headline.`,
    },
    LANDSCAPE: {
      headline: `${brand.brandName}: ${offer.offerTitle}`,
      primaryText: strategy.secondaryHook,
      description: `${strategy.desiredOutcomes[0]} — ${offer.callToAction}`,
      visualBrief: `Landscape ${staticAdFormatAspectRatio("LANDSCAPE")} banner with product left, copy block right, CTA button, premium ${brand.niche} palette.`,
    },
  };

  return STATIC_AD_FORMATS.map((format) => ({
    creativeId: randomUUID(),
    format,
    headline: formatCopy[format].headline,
    primaryText: formatCopy[format].primaryText,
    description: formatCopy[format].description,
    callToAction: offer.callToAction,
    visualBrief: formatCopy[format].visualBrief,
  }));
}

/** Phase 078C — video ad blueprints for 15s, 30s, 60s. */
function buildVideoScene(
  sceneNumber: number,
  durationSeconds: number,
  visualDescription: string,
  onScreenCaption: string,
) {
  return { sceneNumber, durationSeconds, visualDescription, onScreenCaption };
}

function buildVideoBlueprint(
  input: AdCreativeGenerationInput,
  strategy: CreativeStrategy,
  durationSeconds: VideoAdDuration,
): VideoAdBlueprint {
  const { brand, offer } = input;

  const sceneTemplates: Record<VideoAdDuration, ReturnType<typeof buildVideoScene>[]> = {
    15: [
      buildVideoScene(1, 3, `Close-up hook shot of ${offer.offerTitle}`, strategy.primaryHook),
      buildVideoScene(2, 7, `Quick demo showing key benefit`, offer.keyBenefits[0] ?? offer.valueProposition),
      buildVideoScene(3, 5, `Brand lockup with CTA`, offer.callToAction),
    ],
    30: [
      buildVideoScene(1, 5, `Problem scene: ${strategy.painPoints[0]?.slice(0, 60)}`, strategy.painPoints[0] ?? ""),
      buildVideoScene(2, 8, `Product reveal: ${offer.offerTitle}`, strategy.primaryHook),
      buildVideoScene(3, 10, `Benefit montage for ${brand.brandName}`, offer.keyBenefits.join(" · ")),
      buildVideoScene(4, 7, `Social proof and brand slogan`, brand.slogan),
    ],
    60: [
      buildVideoScene(1, 8, `Audience pain point introduction`, strategy.painPoints[0] ?? ""),
      buildVideoScene(2, 10, `Emotional angle: ${strategy.emotionalAngle}`, strategy.emotionalAngle),
      buildVideoScene(3, 12, `Rational proof: ${strategy.rationalAngle}`, strategy.rationalAngle),
      buildVideoScene(4, 15, `Product demo and benefits`, offer.keyBenefits.join(" · ")),
      buildVideoScene(5, 10, `Desired outcome visualization`, strategy.desiredOutcomes[1] ?? ""),
      buildVideoScene(6, 5, `Closing brand moment`, offer.callToAction),
    ],
  };

  const storyboard = sceneTemplates[durationSeconds];
  const voiceover = storyboard
    .map((scene) => scene.onScreenCaption)
    .join(" ")
    .concat(` ${offer.callToAction}.`);

  return {
    blueprintId: randomUUID(),
    durationSeconds,
    openingHook: strategy.primaryHook,
    storyboard,
    voiceover,
    onScreenCaptions: storyboard.map((scene) => scene.onScreenCaption),
    closingCallToAction: offer.callToAction,
  };
}

function buildVideoBlueprints(
  input: AdCreativeGenerationInput,
  strategy: CreativeStrategy,
): VideoAdBlueprint[] {
  return VIDEO_AD_DURATIONS.map((duration) =>
    buildVideoBlueprint(input, strategy, duration),
  );
}

/** Phase 078D — platform-optimized variants. */
function buildPlatformVariant(
  input: AdCreativeGenerationInput,
  strategy: CreativeStrategy,
  platform: AdCreativePlatform,
): PlatformAdVariant {
  const { brand, offer } = input;

  const platformConfig: Record<
    AdCreativePlatform,
    { format: string; headlineMax: number; notes: string }
  > = {
    FACEBOOK: {
      format: "Landscape 16:9 or Square 1:1 feed ad",
      headlineMax: 40,
      notes: "Lead with social proof and clear value in primary text.",
    },
    INSTAGRAM: {
      format: "Portrait 4:5 Reels/Feed",
      headlineMax: 35,
      notes: "Visual-first hook; minimal text overlay; strong CTA in caption.",
    },
    TIKTOK: {
      format: "Vertical 9:16 short-form video",
      headlineMax: 30,
      notes: "Native UGC-style opening hook within first 2 seconds.",
    },
    YOUTUBE_SHORTS: {
      format: "Vertical 9:16 under 60 seconds",
      headlineMax: 40,
      notes: "Fast-paced benefit delivery with bold on-screen captions.",
    },
    PINTEREST: {
      format: "Portrait 2:3 static pin",
      headlineMax: 45,
      notes: "Inspirational visual with keyword-rich description for discovery.",
    },
  };

  const config = platformConfig[platform];
  const headline =
    platform === "TIKTOK"
      ? strategy.primaryHook.slice(0, config.headlineMax)
      : offer.headline.slice(0, config.headlineMax);

  return {
    variantId: randomUUID(),
    platform,
    headline,
    primaryText:
      platform === "PINTEREST"
        ? `${strategy.emotionalAngle} ${offer.valueProposition}`
        : `${strategy.primaryHook} ${strategy.rationalAngle}`.slice(0, 220),
    description: `${brand.brandName} · ${offer.offerTitle} · ${brand.slogan}`,
    callToAction: offer.callToAction,
    formatRecommendation: config.format,
    optimizationNotes: `${adCreativePlatformLabel(platform)}: ${config.notes}`,
  };
}

function buildPlatformVariants(
  input: AdCreativeGenerationInput,
  strategy: CreativeStrategy,
): PlatformAdVariant[] {
  return AD_CREATIVE_PLATFORMS.map((platform) =>
    buildPlatformVariant(input, strategy, platform),
  );
}

/** Phase 078E — creative scoring. */
function buildCreativeScoring(
  input: AdCreativeGenerationInput,
  strategy: CreativeStrategy,
  staticCreatives: StaticAdCreative[],
  videoBlueprints: VideoAdBlueprint[],
  platformVariants: PlatformAdVariant[],
): CreativeScoring {
  const hookStrength = clampScore(
    strategy.primaryHook.length >= 20 ? 88 : 72,
  );
  const scrollStoppingScore = clampScore(
    hookStrength * 0.6 + (input.offer.keyBenefits.length >= 3 ? 82 : 70) * 0.4,
  );
  const emotionalScore = clampScore(
    strategy.emotionalAngle.length >= 30 ? 86 : 74,
  );
  const clarityScore = clampScore(
    average(staticCreatives.map((creative) => (creative.headline.length <= 50 ? 84 : 72))),
  );
  const conversionScore = clampScore(
    input.brand.confidence * 0.35 +
      (input.offer.callToAction.length >= 10 ? 82 : 68) * 0.35 +
      platformVariants.length * 4,
  );
  const confidence = clampScore(
    scrollStoppingScore * 0.25 +
      emotionalScore * 0.2 +
      clarityScore * 0.2 +
      conversionScore * 0.25 +
      (videoBlueprints.length >= 3 ? 85 : 70) * 0.1,
  );

  return {
    scrollStoppingScore,
    emotionalScore,
    clarityScore,
    conversionScore,
    confidence,
  };
}

function buildRecommendedPrimaryCreative(
  staticCreatives: StaticAdCreative[],
  videoBlueprints: VideoAdBlueprint[],
  platformVariants: PlatformAdVariant[],
  scoring: CreativeScoring,
): RecommendedPrimaryCreative {
  const useVideo = scoring.scrollStoppingScore >= 80;
  const topPlatform = platformVariants[0]!.platform;

  if (useVideo) {
    const video = videoBlueprints.find((entry) => entry.durationSeconds === 15) ?? videoBlueprints[0]!;
    return {
      type: "VIDEO",
      creativeId: video.blueprintId,
      platform: topPlatform,
      rationale: `15-second video blueprint recommended for high scroll-stopping score (${scoring.scrollStoppingScore}).`,
    };
  }

  const square = staticCreatives.find((entry) => entry.format === "SQUARE") ?? staticCreatives[0]!;
  return {
    type: "STATIC",
    creativeId: square.creativeId,
    platform: topPlatform,
    rationale: `Square static creative recommended for clarity score (${scoring.clarityScore}) and feed compatibility.`,
  };
}

function buildCopySummary(
  strategy: CreativeStrategy,
  staticCreatives: StaticAdCreative[],
  platformVariants: PlatformAdVariant[],
): string {
  return [
    `Hooks: ${strategy.primaryHook} / ${strategy.secondaryHook}`,
    `Static variants: ${staticCreatives.length} (${STATIC_AD_FORMATS.join(", ")})`,
    `Platform copy: ${platformVariants.map((entry) => entry.platform).join(", ")}`,
  ].join(" · ");
}

function buildStoryboardSummary(videoBlueprints: VideoAdBlueprint[]): string {
  return videoBlueprints
    .map(
      (blueprint) =>
        `${blueprint.durationSeconds}s: ${blueprint.storyboard.length} scenes — ${blueprint.openingHook.slice(0, 48)}`,
    )
    .join(" | ");
}

function buildSignals(
  input: AdCreativeGenerationInput,
  strategy: CreativeStrategy,
  staticCreatives: StaticAdCreative[],
  videoBlueprints: VideoAdBlueprint[],
  platformVariants: PlatformAdVariant[],
  scoring: CreativeScoring,
): AdCreativeSignal[] {
  return [
    buildSignal(
      "strategy_strength",
      clampScore(strategy.painPoints.length * 20 + strategy.desiredOutcomes.length * 15),
      `${strategy.painPoints.length} pain points, ${strategy.desiredOutcomes.length} outcomes`,
    ),
    buildSignal(
      "static_coverage",
      clampScore(staticCreatives.length * 30),
      `${staticCreatives.length} static formats generated`,
    ),
    buildSignal(
      "video_coverage",
      clampScore(videoBlueprints.length * 30),
      `${videoBlueprints.length} video durations generated`,
    ),
    buildSignal(
      "platform_fit",
      clampScore(platformVariants.length * 18),
      `${platformVariants.length} platform variants optimized`,
    ),
    buildSignal(
      "copy_quality",
      scoring.clarityScore,
      `Clarity score ${scoring.clarityScore}`,
    ),
    buildSignal(
      "scoring_composite",
      scoring.confidence,
      `Creative confidence ${scoring.confidence}`,
    ),
    buildSignal(
      "package_composite",
      scoring.confidence,
      `Package ready for ${input.brand.brandName}`,
    ),
  ];
}

/** Generates a full ad creative package — structured blueprints only, no live submission. */
export function generateAdCreativePackage(
  input: AdCreativeGenerationInput,
): AdCreativeGenerationBreakdown {
  const angles = resolveAdAngles(input);
  const creativeStrategy = buildCreativeStrategy(input, angles);
  const staticCreatives = buildStaticCreatives(input, creativeStrategy);
  const videoBlueprints = buildVideoBlueprints(input, creativeStrategy);
  const platformVariants = buildPlatformVariants(input, creativeStrategy);
  const creativeScoring = buildCreativeScoring(
    input,
    creativeStrategy,
    staticCreatives,
    videoBlueprints,
    platformVariants,
  );
  const recommendedPrimaryCreative = buildRecommendedPrimaryCreative(
    staticCreatives,
    videoBlueprints,
    platformVariants,
    creativeScoring,
  );
  const copySummary = buildCopySummary(creativeStrategy, staticCreatives, platformVariants);
  const storyboardSummary = buildStoryboardSummary(videoBlueprints);
  const signals = buildSignals(
    input,
    creativeStrategy,
    staticCreatives,
    videoBlueprints,
    platformVariants,
    creativeScoring,
  );

  return {
    brandId: input.brand.brandId,
    storeId: input.storeId ?? null,
    campaignId: input.campaignId ?? null,
    packageName: buildPackageName(input.brand, input.offer),
    creativeStrategy,
    staticCreatives,
    videoBlueprints,
    platformVariants,
    creativeScoring,
    recommendedPrimaryCreative,
    copySummary,
    storyboardSummary,
    signals,
    blueprintOnly: true,
    liveSubmissionEnabled: false,
    imageGenerationEnabled: false,
  };
}

export const adCreativeGenerationScoring = {
  generateAdCreativePackage,
  weights: AD_CREATIVE_SIGNAL_WEIGHTS,
};
