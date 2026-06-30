import { z } from "zod";

export const GENERATED_COMPONENT_TYPES = [
  "LAYOUT",
  "PAGE",
  "SECTION",
  "SHARED",
] as const;

export type GeneratedComponentType = (typeof GENERATED_COMPONENT_TYPES)[number];

/** A generated reusable component in the storefront codebase. */
export type GeneratedComponent = {
  componentId: string;
  componentName: string;
  componentType: GeneratedComponentType;
  filePath: string;
  imports: string[];
  exports: string[];
  sourceCode: string;
};

export const generatedComponentSchema = z.object({
  componentId: z.string().min(1),
  componentName: z.string().min(1),
  componentType: z.enum(GENERATED_COMPONENT_TYPES),
  filePath: z.string().min(1),
  imports: z.array(z.string()),
  exports: z.array(z.string()),
  sourceCode: z.string().min(1),
});

/** Validates a GeneratedComponent record shape. */
export function validateGeneratedComponent(value: unknown): GeneratedComponent {
  return generatedComponentSchema.parse(value);
}
