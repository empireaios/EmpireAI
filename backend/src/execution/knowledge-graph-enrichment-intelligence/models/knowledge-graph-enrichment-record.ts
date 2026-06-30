import { z } from "zod";

import {
  knowledgeGraphEnrichmentReportSchema,
  type KnowledgeGraphEnrichmentReport,
} from "./knowledge-graph-enrichment-report.js";

export type KnowledgeGraphEnrichmentRecordId = string;

/** Persisted knowledge graph enrichment intelligence record. */
export type KnowledgeGraphEnrichmentRecord = KnowledgeGraphEnrichmentReport & {
  recordId: KnowledgeGraphEnrichmentRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeGraphEnrichmentRecordCreateInput = Omit<
  KnowledgeGraphEnrichmentRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const knowledgeGraphEnrichmentRecordSchema = knowledgeGraphEnrichmentReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a KnowledgeGraphEnrichmentRecord record shape. */
export function validateKnowledgeGraphEnrichmentRecord(
  value: unknown,
): KnowledgeGraphEnrichmentRecord {
  return knowledgeGraphEnrichmentRecordSchema.parse(value);
}
