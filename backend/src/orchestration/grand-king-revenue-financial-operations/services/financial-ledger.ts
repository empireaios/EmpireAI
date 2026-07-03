/**
 * G7-05 — Financial ledger (canonical record store).
 */

import type { FinancialRecord, FinancialStatus } from "../contracts/financial-operations-types.js";
import { isValidFinancialStatusTransition } from "../contracts/financial-operations-types.js";

const ledger = new Map<string, FinancialRecord>();

export function resetFinancialLedgerForTests(): void {
  ledger.clear();
}

export function appendFinancialRecord(record: FinancialRecord): void {
  ledger.set(record.financialRecordId, record);
}

export function getFinancialRecord(financialRecordId: string): FinancialRecord | undefined {
  return ledger.get(financialRecordId);
}

export function listFinancialRecords(): FinancialRecord[] {
  return [...ledger.values()];
}

export function listFinancialRecordsByDomain(domainId: string): FinancialRecord[] {
  return listFinancialRecords().filter((r) => r.domainId === domainId);
}

export function listFinancialRecordsByProvider(providerId: string): FinancialRecord[] {
  return listFinancialRecords().filter((r) => r.providerId === providerId);
}

export function transitionFinancialRecordStatus(
  financialRecordId: string,
  targetStatus: FinancialStatus,
): FinancialRecord {
  const record = ledger.get(financialRecordId);
  if (!record) {
    throw new Error(`Financial record not found: ${financialRecordId}`);
  }
  if (!isValidFinancialStatusTransition(record.status, targetStatus)) {
    throw new Error(`Invalid financial status transition: ${record.status} -> ${targetStatus}`);
  }
  const updated: FinancialRecord = {
    ...record,
    status: targetStatus,
    updatedAt: new Date().toISOString(),
    governanceState: targetStatus === "reconciled" ? "pillow-reconciled" : record.governanceState,
    reconciliationStatus: targetStatus === "reconciled" ? "reconciled" : record.reconciliationStatus,
  };
  ledger.set(financialRecordId, updated);
  return updated;
}

export function sumLedgerAmounts(
  predicate: (record: FinancialRecord) => boolean,
  field: "grossAmount" | "netAmount" | "fees" | "refundAmount" | "taxAmount",
): number {
  return listFinancialRecords()
    .filter(predicate)
    .reduce((sum, record) => sum + record[field], 0);
}
