import type { EmpireMemoryInput } from "./types.js";
/** Captures structural organizational memory through the owning manager. */
export class OrganizationalMemoryEngine {
  normalize(input: EmpireMemoryInput = {}) { return { ...input, memoryCategory: input.memoryCategory ?? "organizational_memory" as const }; }
}
