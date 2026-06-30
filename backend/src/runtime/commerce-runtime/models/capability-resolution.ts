import { z } from "zod";

export const CapabilitySupportLevelSchema = z.enum([
  "supported",
  "unsupported",
  "partial",
  "blocked",
]);

export type CapabilitySupportLevel = z.infer<typeof CapabilitySupportLevelSchema>;

export const AdapterCapabilityEntrySchema = z.object({
  adapterId: z.string(),
  displayName: z.string(),
  kernel: z.string(),
  supportLevel: CapabilitySupportLevelSchema,
  reason: z.string(),
});

export type AdapterCapabilityEntry = z.infer<typeof AdapterCapabilityEntrySchema>;

export const CapabilityResolutionSchema = z.object({
  operation: z.string(),
  resolvedAt: z.string(),
  entries: z.array(AdapterCapabilityEntrySchema),
  summary: z.object({
    supported: z.number(),
    partial: z.number(),
    unsupported: z.number(),
    blocked: z.number(),
  }),
});

export type CapabilityResolution = z.infer<typeof CapabilityResolutionSchema>;
