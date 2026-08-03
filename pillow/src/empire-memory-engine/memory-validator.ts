import type { MemoryRecord } from "./types.js";
export class MemoryValidator {
  validate(record: MemoryRecord) { return { valid: record.structuralSignalOnly && record.neverAlterValidatedHistoricalRecordsWithoutAuthorization, errors: [] as string[] }; }
}
