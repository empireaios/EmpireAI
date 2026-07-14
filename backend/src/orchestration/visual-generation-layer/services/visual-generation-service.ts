import { randomUUID } from "node:crypto";

import type {
  VisualGenerationHealth,
  VisualGenerationRequest,
  VisualGenerationResult,
  VisualGenerationUseCase,
} from "../models/visual-generation-types.js";
import { visualGenerationRequestSchema } from "../models/visual-generation-types.js";
import {
  DEFAULT_VISUAL_PROVIDER,
  getVisualProvider,
  listVisualProviders,
} from "../providers/canva-visual-provider.js";

export class VisualGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisualGenerationError";
  }
}

function resolveProvider(request: VisualGenerationRequest) {
  return getVisualProvider(request.providerId ?? DEFAULT_VISUAL_PROVIDER);
}

function useCaseTitle(useCase: VisualGenerationUseCase, prompt?: string): string {
  const labels: Record<VisualGenerationUseCase, string> = {
    commerce: "Commerce Product Visual",
    media: "Media Business Creative",
    marketing: "Marketing Creative",
    executive: "Executive Presentation Asset",
    brand: "Brand Asset",
    documentation: "Documentation Visual",
    training: "Training Material",
    mockup: "Product Mockup",
    general: "Visual Asset",
  };
  return prompt ?? labels[useCase];
}

export async function createVisualAsset(
  input: VisualGenerationRequest,
): Promise<VisualGenerationResult> {
  const request = visualGenerationRequestSchema.parse({
    ...input,
    title: input.title ?? useCaseTitle(input.useCase, input.prompt),
  });
  const provider = resolveProvider(request);
  return provider.createVisualAsset(request);
}

export async function createDesign(input: VisualGenerationRequest): Promise<VisualGenerationResult> {
  const request = visualGenerationRequestSchema.parse(input);
  return resolveProvider(request).createDesign(request);
}

export async function searchDesigns(input: VisualGenerationRequest): Promise<VisualGenerationResult> {
  const request = visualGenerationRequestSchema.parse(input);
  return resolveProvider(request).searchDesigns(request);
}

export async function duplicateDesign(input: VisualGenerationRequest): Promise<VisualGenerationResult> {
  const request = visualGenerationRequestSchema.parse(input);
  return resolveProvider(request).duplicateDesign(request);
}

export async function uploadVisualAsset(input: VisualGenerationRequest): Promise<VisualGenerationResult> {
  const request = visualGenerationRequestSchema.parse(input);
  return resolveProvider(request).uploadAsset(request);
}

export async function exportVisualDesign(input: VisualGenerationRequest): Promise<VisualGenerationResult> {
  const request = visualGenerationRequestSchema.parse(input);
  return resolveProvider(request).exportDesign(request);
}

export async function generateCommerceCreative(
  input: Omit<VisualGenerationRequest, "useCase">,
): Promise<VisualGenerationResult> {
  return createVisualAsset({ ...input, useCase: "commerce" });
}

export async function generateMarketingCreative(
  input: Omit<VisualGenerationRequest, "useCase">,
): Promise<VisualGenerationResult> {
  return createVisualAsset({ ...input, useCase: "marketing" });
}

export async function generateExecutivePresentationAsset(
  input: Omit<VisualGenerationRequest, "useCase">,
): Promise<VisualGenerationResult> {
  return createDesign({ ...input, useCase: "executive", format: "pdf" });
}

export async function generateBrandedTemplate(
  input: Omit<VisualGenerationRequest, "useCase">,
): Promise<VisualGenerationResult> {
  return createDesign({ ...input, useCase: "brand", title: input.title ?? "EmpireAI Branded Template" });
}

export async function getVisualGenerationHealth(
  workspaceId: string,
  companyId: string,
): Promise<VisualGenerationHealth> {
  const providerStatuses = await Promise.all(
    listVisualProviders().map(async (providerId) => {
      const health = await getVisualProvider(providerId).getHealth(workspaceId, companyId);
      return { providerId, ...health };
    }),
  );

  return {
    layerId: "visual-generation-layer",
    defaultProvider: DEFAULT_VISUAL_PROVIDER,
    providers: providerStatuses,
    checkedAt: new Date().toISOString(),
  };
}

export function createVisualGenerationJobId(): string {
  return `vgl-job-${randomUUID()}`;
}
