import { z } from "zod";

import {
  availabilityStatusSchema,
  type AvailabilityStatus,
} from "./availability-status.js";
import {
  domainAlternativeSchema,
  type DomainAlternative,
} from "./domain-alternative.js";
import { domainSignalSchema, type DomainSignal } from "./domain-signal.js";

export type DomainRecommendationId = string;

/** Domain recommendation generated from brand intelligence inputs. */
export type DomainRecommendation = {
  recommendationId: DomainRecommendationId;
  workspaceId: string;
  brandId: string;
  storeId: string | null;
  primaryDomain: string;
  alternativeDomains: DomainAlternative[];
  brandFitScore: number;
  availabilityStatus: AvailabilityStatus;
  confidence: number;
  signals: DomainSignal[];
  createdAt: string;
  updatedAt: string;
};

export type DomainRecommendationCreateInput = Omit<
  DomainRecommendation,
  "recommendationId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const domainRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  workspaceId: z.string().min(1),
  brandId: z.string().min(1),
  storeId: z.string().nullable(),
  primaryDomain: z.string().min(1),
  alternativeDomains: z.array(domainAlternativeSchema).min(1),
  brandFitScore: z.number().min(0).max(100),
  availabilityStatus: availabilityStatusSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(domainSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a DomainRecommendation record shape. */
export function validateDomainRecommendation(value: unknown): DomainRecommendation {
  return domainRecommendationSchema.parse(value);
}
