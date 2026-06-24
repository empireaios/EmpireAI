import { z } from "zod";

import type { SignalSource } from "../../global-product-signals/models/signal-source.js";
import { SIGNAL_SOURCES } from "../../global-product-signals/models/signal-source.js";

/** Investigation subject requiring EmpireAI attention. */
export type InvestigationTarget = {
  targetId: string;
  workspaceId: string;
  productId: string;
  buyerPersonaId: string | null;
  label: string;
  primarySource: SignalSource | null;
  createdAt: string;
  updatedAt: string;
};

export type InvestigationTargetInput = {
  productId: string;
  buyerPersonaId?: string;
  label?: string;
  primarySource?: SignalSource;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const investigationTargetSchema = z.object({
  targetId: z.string().min(1),
  workspaceId: z.string().min(1),
  productId: z.string().min(1),
  buyerPersonaId: z.string().nullable(),
  label: z.string().min(1),
  primarySource: z.enum(SIGNAL_SOURCES).nullable(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an InvestigationTarget record shape. */
export function validateInvestigationTarget(value: unknown): InvestigationTarget {
  return investigationTargetSchema.parse(value);
}
