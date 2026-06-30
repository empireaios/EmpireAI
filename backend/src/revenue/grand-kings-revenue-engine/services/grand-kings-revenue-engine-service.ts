import { randomUUID } from "node:crypto";

import {
  isGrandKingsRevenueEngineEnabled,
  loadGrandKingsRevenueEnv,
} from "../config/grand-kings-revenue-env.js";
import type {
  AdvertisingLifecycleSnapshot,
  CapitalLifecycleSnapshot,
  GrandKingsRevenueCycleRecord,
  KpiLifecycleSnapshot,
  OrderLifecycleSnapshot,
  RevenueLifecycleSnapshot,
} from "../models/grand-kings-revenue-cycle-record.js";
import {
  createCycleRecord,
  getGrandKingsRevenueRepository,
} from "../repositories/sqlite-grand-kings-revenue-repository.js";
import {
  collectAdvertisingLifecycle,
  collectCapitalLifecycle,
  collectOrderLifecycle,
  collectRevenueLifecycle,
  computeKpiLifecycle,
} from "./lifecycle-collector-service.js";

export class GrandKingsRevenueBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrandKingsRevenueBlockedError";
  }
}

export type RunGrandKingsRevenueCycleInput = {
  workspaceId: string;
  companyId: string;
  correlationId?: string;
};

function assertEngineEnabled(): void {
  const env = loadGrandKingsRevenueEnv();
  if (!isGrandKingsRevenueEngineEnabled(env)) {
    throw new GrandKingsRevenueBlockedError("Grand King's Revenue Engine is disabled");
  }
}

/** Runs a full operational cycle across revenue, ads, orders, capital, and KPI lifecycles. */
export function runGrandKingsRevenueCycle(
  input: RunGrandKingsRevenueCycleInput,
): GrandKingsRevenueCycleRecord {
  assertEngineEnabled();
  const env = loadGrandKingsRevenueEnv();

  const revenue = collectRevenueLifecycle(input);
  const advertising = collectAdvertisingLifecycle(input);
  const order = collectOrderLifecycle(input);
  const capital = collectCapitalLifecycle(input);
  const kpi = computeKpiLifecycle({ revenue, advertising, order, capital });

  const record = createCycleRecord({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    correlationId: input.correlationId ?? `gk-cycle-${randomUUID()}`,
    revenue,
    advertising,
    order,
    capital,
    kpi,
    overallHealthScore: kpi.overallHealthScore,
    mock: env.GRAND_KINGS_REVENUE_ENGINE_MOCK,
  });

  return getGrandKingsRevenueRepository().saveCycle(record);
}

export function getRevenueLifecycleSnapshot(
  workspaceId: string,
  companyId: string,
): RevenueLifecycleSnapshot {
  assertEngineEnabled();
  return collectRevenueLifecycle({ workspaceId, companyId });
}

export function getAdvertisingLifecycleSnapshot(
  workspaceId: string,
  companyId: string,
): AdvertisingLifecycleSnapshot {
  assertEngineEnabled();
  return collectAdvertisingLifecycle({ workspaceId, companyId });
}

export function getOrderLifecycleSnapshot(
  workspaceId: string,
  companyId: string,
): OrderLifecycleSnapshot {
  assertEngineEnabled();
  return collectOrderLifecycle({ workspaceId, companyId });
}

export function getCapitalLifecycleSnapshot(
  workspaceId: string,
  companyId: string,
): CapitalLifecycleSnapshot {
  assertEngineEnabled();
  return collectCapitalLifecycle({ workspaceId, companyId });
}

/** Returns KPI snapshot — from latest cycle if present, otherwise computed live. */
export function getKpiLifecycleSnapshot(
  workspaceId: string,
  companyId: string,
): KpiLifecycleSnapshot {
  assertEngineEnabled();
  const latest = getGrandKingsRevenueRepository().getLatestCycle(workspaceId, companyId);
  if (latest) {
    return latest.kpi;
  }

  const revenue = collectRevenueLifecycle({ workspaceId, companyId });
  const advertising = collectAdvertisingLifecycle({ workspaceId, companyId });
  const order = collectOrderLifecycle({ workspaceId, companyId });
  const capital = collectCapitalLifecycle({ workspaceId, companyId });
  return computeKpiLifecycle({ revenue, advertising, order, capital });
}

export function getGrandKingsRevenueCycleById(
  cycleId: string,
): GrandKingsRevenueCycleRecord | null {
  return getGrandKingsRevenueRepository().getCycleById(cycleId);
}

export function listGrandKingsRevenueCycles(
  workspaceId: string,
  companyId?: string,
): GrandKingsRevenueCycleRecord[] {
  return getGrandKingsRevenueRepository().listCycles(workspaceId, companyId);
}

export function getLatestGrandKingsRevenueCycle(
  workspaceId: string,
  companyId?: string,
): GrandKingsRevenueCycleRecord | null {
  return getGrandKingsRevenueRepository().getLatestCycle(workspaceId, companyId);
}
