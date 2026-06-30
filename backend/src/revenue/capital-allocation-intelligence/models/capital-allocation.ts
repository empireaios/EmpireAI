import { z } from "zod";

import { PORTFOLIO_STATES, type PortfolioState } from "../../opportunity-portfolio/models/opportunity-portfolio.js";
import { allocationSignalSchema, type AllocationSignal } from "./allocation-signal.js";

export type CapitalAllocationId = string;

/** Capital allocation assigned to a portfolio opportunity. */
export type CapitalAllocation = {
  allocationId: CapitalAllocationId;
  workspaceId: string;
  portfolioEntryId: string | null;
  opportunityId: string;
  productId: string;
  portfolioState: PortfolioState;
  allocationPercentage: number;
  allocationAmount: number;
  riskAdjustedAllocation: number;
  confidence: number;
  rationale: string;
  totalCapital: number;
  signals: AllocationSignal[];
  createdAt: string;
  updatedAt: string;
};

export type CapitalAllocationCreateInput = Omit<
  CapitalAllocation,
  "allocationId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const capitalAllocationSchema = z.object({
  allocationId: z.string().min(1),
  workspaceId: z.string().min(1),
  portfolioEntryId: z.string().nullable(),
  opportunityId: z.string().min(1),
  productId: z.string().min(1),
  portfolioState: z.enum(PORTFOLIO_STATES),
  allocationPercentage: z.number().min(0).max(100),
  allocationAmount: z.number().min(0),
  riskAdjustedAllocation: z.number().min(0),
  confidence: z.number().min(0).max(100),
  rationale: z.string().min(1),
  totalCapital: z.number().min(0),
  signals: z.array(allocationSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CapitalAllocation record shape. */
export function validateCapitalAllocation(value: unknown): CapitalAllocation {
  return capitalAllocationSchema.parse(value);
}
