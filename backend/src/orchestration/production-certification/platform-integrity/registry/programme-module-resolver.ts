/**
 * G6-01 — Programme module resolver (registry-driven moduleResolverRef).
 */

import { createInfrastructureCommerceModuleContract } from "../../../infrastructure-commerce/contract/commerce-registry-module.js";
import { createBusinessAutomationModuleContract } from "../../../business-automation/contract/business-automation-module.js";
import { createProductionCertificationModuleContract } from "../../contract/production-certification-module.js";
import { createIdentityRegistryModuleContract } from "../../../../foundation/identity-registry/contract/identity-registry-module.js";

export type ResolvedProgrammeModule = {
  moduleId: string;
  missionId?: string;
  programmeStatus?: string;
  integratesWith: readonly string[];
};

const MODULE_RESOLVERS: Record<string, () => ResolvedProgrammeModule> = {
  "resolve:infrastructure-commerce-module": () => {
    const c = createInfrastructureCommerceModuleContract();
    return { moduleId: c.moduleId, missionId: c.missionId, programmeStatus: c.programmeStatus, integratesWith: c.integratesWith };
  },
  "resolve:business-automation-module": () => {
    const c = createBusinessAutomationModuleContract();
    return { moduleId: c.moduleId, missionId: c.missionId, programmeStatus: c.programmeStatus, integratesWith: c.integratesWith };
  },
  "resolve:production-certification-module": () => {
    const c = createProductionCertificationModuleContract();
    return { moduleId: c.moduleId, missionId: c.missionId, programmeStatus: c.programmeStatus, integratesWith: c.integratesWith };
  },
  "resolve:identity-registry-module": () => {
    const c = createIdentityRegistryModuleContract();
    return { moduleId: c.moduleId, integratesWith: ["registry", "pillow"] };
  },
  "resolve:executive-intelligence-orchestrator-module": () => ({
    moduleId: "executive-intelligence-orchestrator",
    missionId: "G3-10",
    programmeStatus: "architecture-complete",
    integratesWith: ["brain", "pillow", "ekls", "registry"],
  }),
};

export function resolveProgrammeModule(moduleResolverRef: string): ResolvedProgrammeModule | undefined {
  return MODULE_RESOLVERS[moduleResolverRef]?.();
}

export function listModuleResolverRefs(): string[] {
  return Object.keys(MODULE_RESOLVERS);
}
