import type { FirstRevenueValidationRecord } from "../models/first-revenue-validation-record.js";

export interface FirstRevenueValidationRepository {
  saveValidation(record: FirstRevenueValidationRecord): FirstRevenueValidationRecord;
  getValidationById(validationId: string): FirstRevenueValidationRecord | null;
  listValidations(workspaceId: string, companyId?: string): FirstRevenueValidationRecord[];
}
