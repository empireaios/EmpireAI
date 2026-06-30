import { z } from "zod";

import {
  availabilityStatusSchema,
  type AvailabilityStatus,
} from "./availability-status.js";

/** A ranked alternative domain recommendation. */
export type DomainAlternative = {
  domain: string;
  brandFitScore: number;
  availabilityStatus: AvailabilityStatus;
};

export const domainAlternativeSchema = z.object({
  domain: z.string().min(1),
  brandFitScore: z.number().min(0).max(100),
  availabilityStatus: availabilityStatusSchema,
});

/** Validates a DomainAlternative record shape. */
export function validateDomainAlternative(value: unknown): DomainAlternative {
  return domainAlternativeSchema.parse(value);
}
