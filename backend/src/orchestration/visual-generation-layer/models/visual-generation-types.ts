import { z } from "zod";

export const VISUAL_GENERATION_PROVIDERS = ["canva"] as const;
export type VisualGenerationProviderId = (typeof VISUAL_GENERATION_PROVIDERS)[number];

export const VISUAL_GENERATION_USE_CASES = [
  "commerce",
  "media",
  "marketing",
  "executive",
  "brand",
  "documentation",
  "training",
  "mockup",
  "general",
] as const;
export type VisualGenerationUseCase = (typeof VISUAL_GENERATION_USE_CASES)[number];

export const VISUAL_EXPORT_FORMATS = ["png", "jpg", "pdf", "mp4"] as const;
export type VisualExportFormat = (typeof VISUAL_EXPORT_FORMATS)[number];

export const visualGenerationRequestSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  useCase: z.enum(VISUAL_GENERATION_USE_CASES).default("general"),
  title: z.string().optional(),
  prompt: z.string().optional(),
  designId: z.string().optional(),
  query: z.string().optional(),
  format: z.enum(VISUAL_EXPORT_FORMATS).optional(),
  providerId: z.enum(VISUAL_GENERATION_PROVIDERS).optional(),
  asset: z
    .object({
      name: z.string().min(1),
      mimeType: z.string().min(1),
      base64Data: z.string().min(1),
    })
    .optional(),
});

export type VisualGenerationRequest = z.infer<typeof visualGenerationRequestSchema>;

export type VisualGenerationResult = {
  jobId: string;
  provider: VisualGenerationProviderId;
  status: "success" | "failed" | "in_progress";
  useCase: VisualGenerationUseCase;
  designId: string | null;
  assetIds: string[];
  exportFormat: VisualExportFormat | null;
  exportLocation: string | null;
  errors: string[];
  warnings: string[];
  usageMetadata: {
    mock: boolean;
    providerCostCents: number | null;
    operation: string;
  };
  createdAt: string;
};

export type VisualGenerationHealth = {
  layerId: "visual-generation-layer";
  defaultProvider: VisualGenerationProviderId;
  providers: Array<{
    providerId: VisualGenerationProviderId;
    connected: boolean;
    healthy: boolean;
    mock: boolean;
    lastError: string | null;
  }>;
  checkedAt: string;
};
