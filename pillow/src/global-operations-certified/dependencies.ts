import type { CertifiedModuleId } from "./types.js";
/** Read-only dependency contract: certification may only invoke structural probes. */
export type StructuralGlobalModule = {
  getState?: () => unknown;
  validateForSupervisorSync?: () => unknown;
  getEngineRecord?: () => unknown;
};
export type GlobalOperationsCertifiedDependencies = Record<CertifiedModuleId, StructuralGlobalModule | null>;
