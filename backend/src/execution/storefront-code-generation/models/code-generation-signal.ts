import { z } from "zod";

export const CODE_GENERATION_SIGNAL_TYPES = [
  "storefront_alignment",
  "page_code_coverage",
  "component_reuse",
  "project_structure",
  "deployment_readiness",
  "brand_alignment",
  "page_content_alignment",
  "code_generation_composite",
] as const;

export type CodeGenerationSignalType = (typeof CODE_GENERATION_SIGNAL_TYPES)[number];

/** Individual factor contributing to storefront code generation scoring. */
export type CodeGenerationSignal = {
  signalType: CodeGenerationSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const codeGenerationSignalSchema = z.object({
  signalType: z.enum(CODE_GENERATION_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a CodeGenerationSignal record shape. */
export function validateCodeGenerationSignal(value: unknown): CodeGenerationSignal {
  return codeGenerationSignalSchema.parse(value);
}
