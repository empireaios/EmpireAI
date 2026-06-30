import { z } from "zod";

import { seoProfileSchema, type SeoProfile } from "./seo-profile.js";

export type SeoIntelligenceRecordId = string;

/** Persisted SEO intelligence record. */
export type SeoIntelligenceRecord = SeoProfile & {
  recordId: SeoIntelligenceRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type SeoIntelligenceRecordCreateInput = Omit<
  SeoIntelligenceRecord,
  "recordId" | "workspaceId" | "profileId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const seoIntelligenceRecordSchema = seoProfileSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a SeoIntelligenceRecord record shape. */
export function validateSeoIntelligenceRecord(value: unknown): SeoIntelligenceRecord {
  return seoIntelligenceRecordSchema.parse(value);
}
