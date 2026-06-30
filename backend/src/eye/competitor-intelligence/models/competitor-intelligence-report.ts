import { z } from "zod";

import { competitorAlertSchema, type CompetitorAlert } from "./competitor-alert.js";
import { competitorChangeSchema, type CompetitorChange } from "./competitor-change.js";
import { competitorProfileSchema, type CompetitorProfile } from "./competitor-profile.js";
import { competitorSnapshotSchema, type CompetitorSnapshot } from "./competitor-snapshot.js";
import {
  competitorIntelligenceSignalSchema,
  type CompetitorIntelligenceSignal,
} from "./competitor-intelligence-signal.js";

export type CompetitorIntelligenceReportId = string;

/** Complete competitor intelligence report — mock observations, no live API. */
export type CompetitorIntelligenceReport = {
  reportId: CompetitorIntelligenceReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  competitors: CompetitorProfile[];
  snapshots: CompetitorSnapshot[];
  changes: CompetitorChange[];
  alerts: CompetitorAlert[];
  confidence: number;
  signals: CompetitorIntelligenceSignal[];
  intelligenceOnly: true;
  liveApiEnabled: false;
};

export type CompetitorIntelligenceReportCreateInput = Omit<
  CompetitorIntelligenceReport,
  "reportId"
>;

export const competitorIntelligenceReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  competitors: z.array(competitorProfileSchema).min(1),
  snapshots: z.array(competitorSnapshotSchema).min(1),
  changes: z.array(competitorChangeSchema),
  alerts: z.array(competitorAlertSchema),
  confidence: z.number().min(0).max(100),
  signals: z.array(competitorIntelligenceSignalSchema),
  intelligenceOnly: z.literal(true),
  liveApiEnabled: z.literal(false),
});

/** Validates a CompetitorIntelligenceReport record shape. */
export function validateCompetitorIntelligenceReport(
  value: unknown,
): CompetitorIntelligenceReport {
  return competitorIntelligenceReportSchema.parse(value);
}
