import {
  isFirstRevenueValidationEnabled,
  loadFirstRevenueValidationEnv,
} from "../config/first-revenue-validation-env.js";
import type { FirstRevenueValidationRecord } from "../models/first-revenue-validation-record.js";
import {
  createValidationRecord,
  getFirstRevenueValidationRepository,
} from "../repositories/sqlite-first-revenue-validation-repository.js";
import {
  executeFirstRevenueValidation,
  type ExecuteFirstRevenueValidationInput,
} from "./first-revenue-validation-executor.js";
import {
  assessProductionReadiness,
  type ProductionReadinessAssessment,
} from "./production-readiness-assessor.js";

export class FirstRevenueValidationBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FirstRevenueValidationBlockedError";
  }
}

function assertEnabled(): void {
  if (!isFirstRevenueValidationEnabled(loadFirstRevenueValidationEnv())) {
    throw new FirstRevenueValidationBlockedError("First revenue validation is disabled");
  }
}

/** Runs and persists a full Product → Profit validation cycle. */
export function runFirstRevenueValidation(
  input: ExecuteFirstRevenueValidationInput,
): Promise<FirstRevenueValidationRecord> {
  assertEnabled();
  return executeFirstRevenueValidation(input).then((result) =>
    getFirstRevenueValidationRepository().saveValidation(createValidationRecord(result)),
  );
}

/** Returns production readiness assessment without executing a cycle. */
export function getProductionReadinessAssessment(): ProductionReadinessAssessment {
  assertEnabled();
  return assessProductionReadiness();
}

export function getFirstRevenueValidationById(
  validationId: string,
): FirstRevenueValidationRecord | null {
  return getFirstRevenueValidationRepository().getValidationById(validationId);
}

export function listFirstRevenueValidations(
  workspaceId: string,
  companyId?: string,
): FirstRevenueValidationRecord[] {
  return getFirstRevenueValidationRepository().listValidations(workspaceId, companyId);
}

export function getLatestFirstRevenueValidation(
  workspaceId: string,
  companyId?: string,
): FirstRevenueValidationRecord | null {
  const records = listFirstRevenueValidations(workspaceId, companyId);
  return records[0] ?? null;
}
