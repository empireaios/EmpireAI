import type { KpiRepository } from "../repositories/kpi-repository.js";
import { getKpiRepository } from "../repositories/sqlite-kpi-repository.js";

export const KPI_ENGINE_MODULE_ID = "kpi-engine" as const;

export type KpiEngineCapability =
  | "kpi-engine.read"
  | "kpi-engine.record"
  | "kpi-engine.dashboard"
  | "kpi-engine.sync"
  | "kpi-engine.lifecycle";

export const KPI_ENGINE_CAPABILITIES: KpiEngineCapability[] = [
  "kpi-engine.read",
  "kpi-engine.record",
  "kpi-engine.dashboard",
  "kpi-engine.sync",
  "kpi-engine.lifecycle",
];

export type KpiEngineModuleContract = {
  moduleId: typeof KPI_ENGINE_MODULE_ID;
  capabilities: KpiEngineCapability[];
  repository: KpiRepository;
};

export function createKpiEngineModuleContract(): KpiEngineModuleContract {
  return {
    moduleId: KPI_ENGINE_MODULE_ID,
    capabilities: KPI_ENGINE_CAPABILITIES,
    repository: getKpiRepository(),
  };
}
