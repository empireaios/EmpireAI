import { randomUUID } from "node:crypto";

import type { BrandProfile } from "../../brand-genesis/models/brand-profile.js";
import type { AdAngle } from "../../marketing-campaign-genesis/models/ad-angle.js";
import type { CreativeAssetBlueprintCreateInput } from "../models/creative-asset-blueprint.js";
import type { CreativeAssetSignal, CreativeAssetSignalType } from "../models/creative-asset-signal.js";
import type { CreativeHook } from "../models/creative-hook.js";
import type { CreativeScript } from "../models/creative-script.js";
import type { ImagePrompt } from "../models/image-prompt.js";
import type { VideoPrompt } from "../models/video-prompt.js";

export const CREATIVE_ASSET_SIGNAL_WEIGHTS: Record<CreativeAssetSignalType, number> = {
  brand_alignment: 0.2,
  hook_strength: 0.2,
  prompt_coverage: 0.18,
  script_readiness: 0.16,
  tool_support: 0.16,
  blueprint_composite: 0.1,
};

export type CreativeAssetBrandInput = Pick<
  BrandProfile,
  | "brandId"
  | "brandName"
  | "slogan"
  | "niche"
  | "targetAudience"
  | "positioning"
  | "confidence"
>;

export type CreativeAssetOfferInput = {
  offerTitle: string;
  headline: string;
  valueProposition: string;
  keyBenefits: string[];
  callToAction: string;
};

export type CreativeAssetBlueprintInput = {
  brand: CreativeAssetBrandInput;
  offer: CreativeAssetOfferInput;
  campaignName?: string;
  campaignId?: string;
  storeId?: string;
  adAngles?: Array<Pick<AdAngle, "title" | "hook">>;
};

export type CreativeAssetBlueprintBreakdown = CreativeAssetBlueprintCreateInput & {
  brandId: string;
  campaignId: string | null;
  storeId: string | null;
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: CreativeAssetSignalType,
  score: number,
  detail: string,
): CreativeAssetSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: CREATIVE_ASSET_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function resolveAdAngles(
  input: CreativeAssetBlueprintInput,
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

function buildImagePrompts(
  brand: CreativeAssetBrandInput,
  offer: CreativeAssetOfferInput,
): ImagePrompt[] {
  const product = offer.offerTitle;
  return [
    {
      promptId: randomUUID(),
      prompt: `Hero product photo of ${product} for ${brand.brandName}, clean studio lighting, ${brand.niche} aesthetic, premium ecommerce ad, slogan "${brand.slogan}"`,
      tool: "IMAGE_GENERATION",
      aspectRatio: "1:1",
      style: "photorealistic product hero",
    },
    {
      promptId: randomUUID(),
      prompt: `Lifestyle scene showing ${brand.targetAudience} using ${product}, warm natural light, ${brand.positioning}, space for headline overlay`,
      tool: "IMAGE_GENERATION",
      aspectRatio: "4:5",
      style: "lifestyle conversion ad",
    },
    {
      promptId: randomUUID(),
      prompt: `Canva-ready carousel template for ${brand.brandName}: slide 1 problem, slide 2 ${offer.valueProposition}, slide 3 benefits, brand colors, modern DTC layout`,
      tool: "CANVA",
      aspectRatio: "1080x1080",
      style: "carousel ad template",
    },
    {
      promptId: randomUUID(),
      prompt: `Static ad banner with ${product}, bold headline "${offer.headline}", subtitle "${brand.slogan}", minimal ${brand.niche} background`,
      tool: "CANVA",
      aspectRatio: "1200x628",
      style: "Facebook feed static",
    },
  ];
}

function buildVideoPrompts(
  brand: CreativeAssetBrandInput,
  offer: CreativeAssetOfferInput,
): VideoPrompt[] {
  return [
    {
      promptId: randomUUID(),
      prompt: `Veo 15s vertical ad: open on pain point for ${brand.targetAudience}, reveal ${offer.offerTitle}, demo key benefit, end with ${brand.brandName} logo and CTA overlay`,
      tool: "VEO",
      durationSeconds: 15,
      format: "9:16 short-form",
    },
    {
      promptId: randomUUID(),
      prompt: `Veo 30s product story: ${offer.headline}, showcase ${offer.keyBenefits[0] ?? offer.valueProposition}, lifestyle montage in ${brand.niche}, closing CTA "${offer.callToAction}"`,
      tool: "VEO",
      durationSeconds: 30,
      format: "16:9 landscape",
    },
    {
      promptId: randomUUID(),
      prompt: `Veo UGC-style clip: creator unboxes ${offer.offerTitle}, authentic reaction, quick benefit callout, on-screen text "${offer.valueProposition}"`,
      tool: "VEO",
      durationSeconds: 15,
      format: "9:16 UGC",
    },
  ];
}

function buildHooks(
  brand: CreativeAssetBrandInput,
  offer: CreativeAssetOfferInput,
  angles: Array<{ title: string; hook: string }>,
): CreativeHook[] {
  const platforms = ["Facebook", "Instagram", "TikTok", "Google"];
  return angles.slice(0, 4).map((angle, index) => ({
    hookId: randomUUID(),
    text: angle.hook,
    platform: platforms[index % platforms.length]!,
    angle: angle.title,
  }));
}

function buildScripts(
  brand: CreativeAssetBrandInput,
  offer: CreativeAssetOfferInput,
): CreativeScript[] {
  const benefit = offer.keyBenefits[0] ?? offer.valueProposition;

  return [
    {
      scriptId: randomUUID(),
      title: "15-second launch spot",
      body: [
        `[HOOK] ${offer.headline}`,
        `[PROBLEM] Still searching for a better ${brand.niche} option?`,
        `[SOLUTION] ${brand.brandName} delivers ${offer.valueProposition}.`,
        `[PROOF] ${benefit}.`,
        `[CTA] ${offer.callToAction}`,
      ].join(" "),
      durationSeconds: 15,
      format: "short-form video",
    },
    {
      scriptId: randomUUID(),
      title: "30-second explainer",
      body: [
        `[OPEN] Meet ${offer.offerTitle} from ${brand.brandName}.`,
        `[VALUE] ${offer.valueProposition}`,
        `[BENEFITS] ${offer.keyBenefits.slice(0, 3).join(". ")}.`,
        `[BRAND] ${brand.slogan}`,
        `[CLOSE] ${offer.callToAction}`,
      ].join(" "),
      durationSeconds: 30,
      format: "explainer video",
    },
    {
      scriptId: randomUUID(),
      title: "Static ad copy block",
      body: `${offer.headline} ${offer.valueProposition} ${benefit}. ${offer.callToAction}`,
      durationSeconds: 0,
      format: "static copy",
    },
  ];
}

function computeConfidence(
  brand: CreativeAssetBrandInput,
  imagePrompts: ImagePrompt[],
  videoPrompts: VideoPrompt[],
  hooks: CreativeHook[],
  scripts: CreativeScript[],
  signals: CreativeAssetSignal[],
): number {
  const toolCoverage =
    (imagePrompts.some((p) => p.tool === "CANVA") ? 1 : 0) +
    (imagePrompts.some((p) => p.tool === "IMAGE_GENERATION") ? 1 : 0) +
    (videoPrompts.some((p) => p.tool === "VEO") ? 1 : 0);

  return clampScore(
    brand.confidence * 0.25 +
      (hooks.length >= 3 ? 86 : 65) * 0.2 +
      (imagePrompts.length >= 3 ? 88 : 62) * 0.2 +
      (videoPrompts.length >= 2 ? 86 : 60) * 0.15 +
      (scripts.length >= 2 ? 84 : 58) * 0.1 +
      (toolCoverage >= 3 ? 90 : 55) * 0.1,
  );
}

function buildSignals(
  brand: CreativeAssetBrandInput,
  imagePrompts: ImagePrompt[],
  videoPrompts: VideoPrompt[],
  hooks: CreativeHook[],
  scripts: CreativeScript[],
  confidence: number,
): CreativeAssetSignal[] {
  const tools = new Set([
    ...imagePrompts.map((prompt) => prompt.tool),
    ...videoPrompts.map((prompt) => prompt.tool),
  ]);

  return [
    buildSignal("brand_alignment", brand.confidence, `Brand ${brand.brandName} creative alignment`),
    buildSignal(
      "hook_strength",
      hooks.length >= 3 ? 88 : 62,
      `${hooks.length} hooks generated`,
    ),
    buildSignal(
      "prompt_coverage",
      imagePrompts.length + videoPrompts.length >= 5 ? 90 : 68,
      `${imagePrompts.length} image prompts and ${videoPrompts.length} video prompts`,
    ),
    buildSignal(
      "script_readiness",
      scripts.length >= 2 ? 86 : 58,
      `${scripts.length} scripts prepared`,
    ),
    buildSignal(
      "tool_support",
      tools.size >= 3 ? 92 : tools.size * 25,
      `Tools supported: ${[...tools].join(", ")}`,
    ),
    buildSignal("blueprint_composite", confidence, `Blueprint confidence ${confidence}`),
  ];
}

/** Generates ad creative asset blueprints from brand and campaign inputs. */
export function generateCreativeAssetBlueprint(
  input: CreativeAssetBlueprintInput,
): CreativeAssetBlueprintBreakdown {
  const { brand, offer, campaignId, storeId } = input;
  const angles = resolveAdAngles(input);
  const imagePrompts = buildImagePrompts(brand, offer);
  const videoPrompts = buildVideoPrompts(brand, offer);
  const hooks = buildHooks(brand, offer, angles);
  const scripts = buildScripts(brand, offer);
  const cta = offer.callToAction;

  const provisionalSignals = buildSignals(
    brand,
    imagePrompts,
    videoPrompts,
    hooks,
    scripts,
    0,
  );
  const confidence = computeConfidence(
    brand,
    imagePrompts,
    videoPrompts,
    hooks,
    scripts,
    provisionalSignals,
  );
  const signals = buildSignals(
    brand,
    imagePrompts,
    videoPrompts,
    hooks,
    scripts,
    confidence,
  );

  return {
    brandId: brand.brandId,
    campaignId: campaignId ?? null,
    storeId: storeId ?? null,
    imagePrompts,
    videoPrompts,
    hooks,
    scripts,
    cta,
    confidence,
    signals,
  };
}

export const creativeAssetBlueprintScoring = {
  generateCreativeAssetBlueprint,
  weights: CREATIVE_ASSET_SIGNAL_WEIGHTS,
};
