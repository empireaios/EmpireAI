import { z } from "zod";

/** Ad script blueprint for video or spoken creative assets. */
export type CreativeScript = {
  scriptId: string;
  title: string;
  body: string;
  durationSeconds: number;
  format: string;
};

export const creativeScriptSchema = z.object({
  scriptId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  durationSeconds: z.number().int().min(0),
  format: z.string().min(1),
});

/** Validates a CreativeScript record shape. */
export function validateCreativeScript(value: unknown): CreativeScript {
  return creativeScriptSchema.parse(value);
}
