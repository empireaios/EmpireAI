import { z } from "zod";

export const COMPANY_STATUSES = ["ACTIVE", "GROWING", "PAUSED", "INCUBATING"] as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

/** Company entry in the unlimited portfolio. */
export type CompanyEntry = {
  companyId: string;
  companyName: string;
  brandName: string;
  niche: string;
  status: CompanyStatus;
  monthlyRevenue: number;
  healthScore: number;
  storeCount: number;
  currency: string;
  score: number;
};

export const companyEntrySchema = z.object({
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  brandName: z.string().min(1),
  niche: z.string().min(1),
  status: z.enum(COMPANY_STATUSES),
  monthlyRevenue: z.number().min(0),
  healthScore: z.number().min(0).max(100),
  storeCount: z.number().int().min(0),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a CompanyEntry record shape. */
export function validateCompanyEntry(value: unknown): CompanyEntry {
  return companyEntrySchema.parse(value);
}
