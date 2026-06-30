import { z } from "zod";

export const STORE_PAGE_SIGNAL_TYPES = [
  "blueprint_alignment",
  "content_alignment",
  "section_completeness",
  "metadata_quality",
  "route_clarity",
  "render_payload_structure",
  "page_type_coverage",
  "page_composite",
] as const;

export type StorePageSignalType = (typeof STORE_PAGE_SIGNAL_TYPES)[number];

/** Individual factor contributing to renderable store page scoring. */
export type StorePageSignal = {
  signalType: StorePageSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const storePageSignalSchema = z.object({
  signalType: z.enum(STORE_PAGE_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a StorePageSignal record shape. */
export function validateStorePageSignal(value: unknown): StorePageSignal {
  return storePageSignalSchema.parse(value);
}
