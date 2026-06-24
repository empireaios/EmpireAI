import { z } from "zod";

import { SIGNAL_SOURCES, type SignalSource } from "../../global-product-signals/models/signal-source.js";
import {
  sourceTrustSignalSchema,
  type SourceTrustSignal,
} from "./source-trust-signal.js";

export type SourceTrustProfileId = string;

export const TRUST_TIERS = ["HIGH_TRUST", "MEDIUM_TRUST", "LOW_TRUST"] as const;
export type TrustTier = (typeof TRUST_TIERS)[number];

/** Trust profile for an external intelligence source. */
export type SourceTrustProfile = {
  id: SourceTrustProfileId;
  workspaceId: string;
  source: SignalSource;
  connectorId: string | null;
  historicalAccuracy: number;
  signalConsistency: number;
  noiseLevel: number;
  manipulationRisk: number;
  reliabilityScore: number;
  trustScore: number;
  trustTier: TrustTier;
  signals: SourceTrustSignal[];
  createdAt: string;
  updatedAt: string;
};

export type SourceTrustProfileCreateInput = Omit<
  SourceTrustProfile,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const sourceTrustProfileSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  source: z.enum(SIGNAL_SOURCES),
  connectorId: z.string().nullable(),
  historicalAccuracy: z.number().min(0).max(100),
  signalConsistency: z.number().min(0).max(100),
  noiseLevel: z.number().min(0).max(100),
  manipulationRisk: z.number().min(0).max(100),
  reliabilityScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  trustTier: z.enum(TRUST_TIERS),
  signals: z.array(sourceTrustSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a SourceTrustProfile record shape. */
export function validateSourceTrustProfile(value: unknown): SourceTrustProfile {
  return sourceTrustProfileSchema.parse(value);
}

/** Maps a trust score to a trust tier label. */
export function resolveTrustTier(trustScore: number): TrustTier {
  if (trustScore >= 75) return "HIGH_TRUST";
  if (trustScore >= 45) return "MEDIUM_TRUST";
  return "LOW_TRUST";
}
