import { z } from "zod";

/** REAL-005 — Product media intelligence (architecture only — no image AI). */
export const MEDIA_TYPES = [
  "supplier_image",
  "lifestyle_image",
  "infographic",
  "comparison_image",
  "short_video",
  "demo_video",
  "marketplace_gallery",
] as const;

export type MediaType = (typeof MEDIA_TYPES)[number];

export const productMediaPackageSchema = z.object({
  packageId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  supplierProductId: z.string(),
  supplierImages: z.array(z.object({ url: z.string(), role: z.string() })),
  recommendations: z.array(z.object({
    mediaType: z.enum(MEDIA_TYPES),
    priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
    recommendation: z.string(),
    executiveOnly: z.literal(true),
  })),
  mediaQualityScore: z.number().min(0).max(100),
  mediaGaps: z.array(z.string()),
  generationQueue: z.array(z.object({
    queueId: z.string(),
    mediaType: z.enum(MEDIA_TYPES),
    status: z.enum(["RECOMMENDED", "QUEUED", "BLOCKED"]),
    reason: z.string(),
  })),
  architectureOnly: z.literal(true),
  computedAt: z.string().datetime({ offset: true }),
});

export type ProductMediaPackage = z.infer<typeof productMediaPackageSchema>;
