import { z } from "zod";

/** Short-form ad hook for creative assets. */
export type CreativeHook = {
  hookId: string;
  text: string;
  platform: string;
  angle: string;
};

export const creativeHookSchema = z.object({
  hookId: z.string().min(1),
  text: z.string().min(1),
  platform: z.string().min(1),
  angle: z.string().min(1),
});

/** Validates a CreativeHook record shape. */
export function validateCreativeHook(value: unknown): CreativeHook {
  return creativeHookSchema.parse(value);
}
