import { z } from "zod";

import { reachabilityChannelSchema, type ReachabilityChannel } from "./reachability-channel.js";
import { reachabilitySignalSchema, type ReachabilitySignal } from "./reachability-signal.js";

export type ReachabilityProfileId = string;

/** Dimension scores describing how a buyer persona can be reached. */
export type ReachabilityDimensions = {
  organicReach: number;
  paidReach: number;
  communityReach: number;
  marketplaceReach: number;
  searchReach: number;
  socialReach: number;
  aiSearchReach: number;
  contentDifficulty: number;
  competitionLevel: number;
  expectedCost: number;
};

/** Full reachability profile for a buyer persona. */
export type ReachabilityProfile = {
  id: ReachabilityProfileId;
  workspaceId: string;
  buyerPersonaId: string;
  dimensions: ReachabilityDimensions;
  channels: ReachabilityChannel[];
  topChannels: string[];
  confidence: number;
  signals: ReachabilitySignal[];
  createdAt: string;
  updatedAt: string;
};

export type ReachabilityProfileCreateInput = Omit<
  ReachabilityProfile,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

export type ReachabilityProfileUpdateInput = Partial<
  Omit<ReachabilityProfileCreateInput, "buyerPersonaId">
>;

const isoTimestamp = z.string().datetime({ offset: true });

const reachabilityDimensionsSchema = z.object({
  organicReach: z.number().min(0).max(100),
  paidReach: z.number().min(0).max(100),
  communityReach: z.number().min(0).max(100),
  marketplaceReach: z.number().min(0).max(100),
  searchReach: z.number().min(0).max(100),
  socialReach: z.number().min(0).max(100),
  aiSearchReach: z.number().min(0).max(100),
  contentDifficulty: z.number().min(0).max(100),
  competitionLevel: z.number().min(0).max(100),
  expectedCost: z.number().min(0),
});

export const reachabilityProfileSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  buyerPersonaId: z.string().min(1),
  dimensions: reachabilityDimensionsSchema,
  channels: z.array(reachabilityChannelSchema),
  topChannels: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  signals: z.array(reachabilitySignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ReachabilityProfile record shape. */
export function validateReachabilityProfile(value: unknown): ReachabilityProfile {
  return reachabilityProfileSchema.parse(value);
}
