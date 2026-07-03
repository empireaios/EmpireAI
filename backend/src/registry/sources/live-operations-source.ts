/**
 * G7-00 — Live operations registry source adapter.
 */

import { LIVE_OPERATION_DOMAIN_SEED_ROWS } from "../../orchestration/grand-king-live-operations/data/live-operation-domain-seed.js";
import { LIVE_OPERATIONS_PROFILE_SEED_ROWS } from "../../orchestration/grand-king-live-operations/data/live-operations-profile-seed.js";
import { FINAL_LIVE_CERTIFICATION_DOMAIN_SEED_ROWS } from "../../orchestration/grand-king-live-operations/final-live-operations-certification/data/final-live-certification-domain-seed.js";
import {
  REG_LIVE_OPERATIONS_DOMAIN,
  REG_LIVE_OPERATIONS_PROFILE,
  REG_LIVE_OPERATIONS_FINAL_CERTIFICATION,
  LIVE_OPERATIONS_REGISTRY_IDS,
  type LiveOperationsRegistryId,
} from "../types/registry-ids.js";
import {
  LIVE_OPERATIONS_REGISTRY_VERSION,
  type LiveOperationsRegistryRowBase,
} from "../types/live-operations-registry-types.js";
import type { RegistryQuery } from "../types/registry-types.js";
import {
  validateLiveOperationsRegistryBatch,
  validateLiveOperationsRegistryRows,
} from "../validation/live-operations-registry-validator.js";

export { LIVE_OPERATIONS_REGISTRY_VERSION };

type LiveOperationsRegistryBatch = Record<LiveOperationsRegistryId, LiveOperationsRegistryRowBase[]>;

let validatedBatch: LiveOperationsRegistryBatch | undefined;

function buildSeedBatch(): LiveOperationsRegistryBatch {
  return {
    [REG_LIVE_OPERATIONS_DOMAIN]: LIVE_OPERATION_DOMAIN_SEED_ROWS,
    [REG_LIVE_OPERATIONS_PROFILE]: LIVE_OPERATIONS_PROFILE_SEED_ROWS,
    [REG_LIVE_OPERATIONS_FINAL_CERTIFICATION]: FINAL_LIVE_CERTIFICATION_DOMAIN_SEED_ROWS,
  };
}

export function getValidatedLiveOperationsRegistryBatch(): LiveOperationsRegistryBatch {
  if (!validatedBatch) {
    const batch = buildSeedBatch();
    validateLiveOperationsRegistryBatch(batch);
    validatedBatch = batch;
  }
  return validatedBatch;
}

export function resetLiveOperationsRegistryBatchForTests(): void {
  validatedBatch = undefined;
}

export function loadLiveOperationsRegistryRows(
  registryId: LiveOperationsRegistryId,
  query?: RegistryQuery,
): LiveOperationsRegistryRowBase[] {
  const batch = getValidatedLiveOperationsRegistryBatch();
  let rows = batch[registryId] ?? [];
  if (query?.registryRowId) {
    rows = rows.filter((row) => row.id === query.registryRowId);
  }
  validateLiveOperationsRegistryRows(registryId, rows);
  return rows;
}

export function listLiveOperationsRegistryFoundationStatus(): Array<{
  registryId: LiveOperationsRegistryId;
  wired: boolean;
  rowCount: number;
}> {
  const batch = getValidatedLiveOperationsRegistryBatch();
  return LIVE_OPERATIONS_REGISTRY_IDS.map((registryId) => ({
    registryId,
    wired: true,
    rowCount: batch[registryId]?.length ?? 0,
  }));
}
