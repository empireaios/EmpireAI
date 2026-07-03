/**
 * G8-01 — Connection registry source adapter.
 */

import { CONNECTION_SCOPE_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-scope-seed.js";
import { CONNECTION_PERMISSION_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-permission-seed.js";
import { CONNECTION_ACCOUNT_HOLDER_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-account-holder-seed.js";
import { CONNECTION_REQUIREMENT_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-requirement-seed.js";
import { CONNECTION_CAPABILITY_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-capability-seed.js";
import { CONNECTION_DEPENDENCY_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-dependency-seed.js";
import { CONNECTION_PROVIDER_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-provider-seed.js";
import {
  REG_CONNECTION_SCOPE,
  REG_CONNECTION_PERMISSION,
  REG_CONNECTION_ACCOUNT_HOLDER,
  REG_CONNECTION_REQUIREMENT,
  REG_CONNECTION_CAPABILITY,
  REG_CONNECTION_DEPENDENCY,
  CONNECTION_REGISTRY_REGISTRY_IDS,
  type ConnectionRegistryRegistryId,
} from "../types/registry-ids.js";
import { CONNECTION_REGISTRY_VERSION, type ConnectionRegistryRowBase } from "../types/connection-registry-types.js";
import type { RegistryQuery } from "../types/registry-types.js";
import {
  validateConnectionProviderRows,
  validateConnectionRegistryBatch,
  validateConnectionRegistryRows,
} from "../validation/connection-registry-validator.js";

export { CONNECTION_REGISTRY_VERSION };

type ConnectionRegistryBatch = Record<ConnectionRegistryRegistryId, ConnectionRegistryRowBase[]>;

let validatedBatch: ConnectionRegistryBatch | undefined;
let validatedProviders = false;

function buildSeedBatch(): ConnectionRegistryBatch {
  return {
    [REG_CONNECTION_SCOPE]: CONNECTION_SCOPE_SEED_ROWS,
    [REG_CONNECTION_PERMISSION]: CONNECTION_PERMISSION_SEED_ROWS,
    [REG_CONNECTION_ACCOUNT_HOLDER]: CONNECTION_ACCOUNT_HOLDER_SEED_ROWS,
    [REG_CONNECTION_REQUIREMENT]: CONNECTION_REQUIREMENT_SEED_ROWS,
    [REG_CONNECTION_CAPABILITY]: CONNECTION_CAPABILITY_SEED_ROWS,
    [REG_CONNECTION_DEPENDENCY]: CONNECTION_DEPENDENCY_SEED_ROWS,
  };
}

export function getValidatedConnectionRegistryBatch(): ConnectionRegistryBatch {
  if (!validatedBatch) {
    const batch = buildSeedBatch();
    validateConnectionRegistryBatch(batch);
    validatedBatch = batch;
  }
  return validatedBatch;
}

export function validateConnectionRegistryProvidersForFoundation(): void {
  if (!validatedProviders) {
    validateConnectionProviderRows(CONNECTION_PROVIDER_SEED_ROWS);
    validatedProviders = true;
  }
}

export function resetConnectionRegistryBatchForTests(): void {
  validatedBatch = undefined;
  validatedProviders = false;
}

export function loadConnectionRegistryRows(
  registryId: ConnectionRegistryRegistryId,
  query?: RegistryQuery,
): ConnectionRegistryRowBase[] {
  const batch = getValidatedConnectionRegistryBatch();
  let rows = batch[registryId] ?? [];
  if (query?.registryRowId) {
    rows = rows.filter((row) => row.id === query.registryRowId);
  }
  validateConnectionRegistryRows(registryId, rows);
  return rows;
}

export function listConnectionRegistryFoundationStatus(): Array<{
  registryId: ConnectionRegistryRegistryId;
  wired: boolean;
  rowCount: number;
}> {
  const batch = getValidatedConnectionRegistryBatch();
  return CONNECTION_REGISTRY_REGISTRY_IDS.map((registryId) => ({
    registryId,
    wired: true,
    rowCount: batch[registryId]?.length ?? 0,
  }));
}
