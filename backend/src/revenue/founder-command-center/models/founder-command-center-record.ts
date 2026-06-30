import { z } from "zod";

import {
  founderCommandCenterSchema,
  type FounderCommandCenter,
} from "./founder-command-center.js";

export type FounderCommandCenterRecordId = string;

/** Persisted founder command center dashboard snapshot. */
export type FounderCommandCenterRecord = FounderCommandCenter & {
  recordId: FounderCommandCenterRecordId;
  workspaceId: string;
  companyCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FounderCommandCenterRecordCreateInput = Omit<
  FounderCommandCenterRecord,
  "recordId" | "workspaceId" | "dashboardId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const founderCommandCenterRecordSchema = founderCommandCenterSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyCount: z.number().int().min(0),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a FounderCommandCenterRecord record shape. */
export function validateFounderCommandCenterRecord(
  value: unknown,
): FounderCommandCenterRecord {
  return founderCommandCenterRecordSchema.parse(value);
}
