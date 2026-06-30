import { z } from "zod";

/** JSON-LD structured data block for a store page. */
export type StructuredDataBlock = {
  pagePath: string;
  schemaType: string;
  jsonLd: Record<string, unknown>;
};

export const structuredDataBlockSchema = z.object({
  pagePath: z.string().min(1),
  schemaType: z.string().min(1),
  jsonLd: z.record(z.string(), z.unknown()),
});

/** Validates a StructuredDataBlock record shape. */
export function validateStructuredDataBlock(value: unknown): StructuredDataBlock {
  return structuredDataBlockSchema.parse(value);
}
