import type { FirstRevenueValidationRecord } from "../models/first-revenue-validation-record.js";
import type { FirstRevenueValidationRepository } from "../repositories/first-revenue-validation-repository.js";
import { getFirstRevenueValidationRepository } from "../repositories/sqlite-first-revenue-validation-repository.js";

export const FIRST_REVENUE_VALIDATION_MODULE_ID = "first-revenue-validation" as const;

export type FirstRevenueValidationCapability =
  | "first-revenue-validation.run"
  | "first-revenue-validation.readiness"
  | "first-revenue-validation.list";

export const FIRST_REVENUE_VALIDATION_CAPABILITIES: FirstRevenueValidationCapability[] = [
  "first-revenue-validation.run",
  "first-revenue-validation.readiness",
  "first-revenue-validation.list",
];

export type FirstRevenueValidationModuleContract = {
  moduleId: typeof FIRST_REVENUE_VALIDATION_MODULE_ID;
  capabilities: FirstRevenueValidationCapability[];
  repository: FirstRevenueValidationRepository;
  getLatest(workspaceId: string, companyId?: string): FirstRevenueValidationRecord | null;
};

export function createFirstRevenueValidationModuleContract(): FirstRevenueValidationModuleContract {
  const repository = getFirstRevenueValidationRepository();
  return {
    moduleId: FIRST_REVENUE_VALIDATION_MODULE_ID,
    capabilities: FIRST_REVENUE_VALIDATION_CAPABILITIES,
    repository,
    getLatest: (workspaceId, companyId) => {
      const records = repository.listValidations(workspaceId, companyId);
      return records[0] ?? null;
    },
  };
}
