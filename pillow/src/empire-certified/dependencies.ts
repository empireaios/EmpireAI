import type { CertifiedDependencyId } from "./types.js";

/** Read-only dependency contract: certification may only invoke structural probes. */
export type StructuralEmpireModule = {
  getState?: () => unknown;
  validateForSupervisorSync?: () => unknown;
  getEngineRecord?: () => unknown;
};

export type EmpireCertifiedDependencies = Record<CertifiedDependencyId, StructuralEmpireModule | null>;
