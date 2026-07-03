/**
 * G8-00 — Identity authorization registry source adapter.
 */

import { AUTHORIZATION_PROVIDER_SEED_ROWS } from "../../orchestration/identity-authorization-platform/data/authorization-provider-seed.js";
import { CREDENTIAL_TYPE_REGISTRY_SEED_ROWS } from "../../orchestration/identity-authorization-platform/credential-vault-integration/data/credential-type-registry-seed.js";
import { CONNECTION_TYPE_REGISTRY_SEED_ROWS } from "../../orchestration/identity-authorization-platform/connection-registry/data/connection-type-registry-seed.js";
import { CONNECTION_POLICY_SEED_ROWS } from "../../orchestration/identity-authorization-platform/data/connection-policy-seed.js";
import { IDENTITY_REPORT_SEED_ROWS } from "../../orchestration/identity-authorization-platform/data/identity-report-seed.js";
import { IDENTITY_NOTIFICATION_SEED_ROWS } from "../../orchestration/identity-authorization-platform/data/identity-notification-seed.js";
import {
  REG_AUTHORIZATION_PROVIDER,
  REG_CREDENTIAL_TYPE,
  REG_CONNECTION_TYPE,
  REG_CONNECTION_POLICY,
  REG_IDENTITY_REPORT,
  REG_IDENTITY_NOTIFICATION,
  IDENTITY_AUTHORIZATION_REGISTRY_IDS,
  type IdentityAuthorizationRegistryId,
} from "../types/registry-ids.js";
import { IDENTITY_AUTHORIZATION_REGISTRY_VERSION } from "../types/identity-authorization-registry-types.js";
import type { IdentityAuthorizationRegistryRowBase } from "../types/identity-authorization-registry-types.js";
import type { RegistryQuery } from "../types/registry-types.js";
import {
  validateIdentityAuthorizationRegistryBatch,
  validateIdentityAuthorizationRegistryRows,
} from "../validation/identity-authorization-registry-validator.js";

export { IDENTITY_AUTHORIZATION_REGISTRY_VERSION };

type IdentityAuthorizationRegistryBatch = Record<
  IdentityAuthorizationRegistryId,
  IdentityAuthorizationRegistryRowBase[]
>;

let validatedBatch: IdentityAuthorizationRegistryBatch | undefined;

function buildSeedBatch(): IdentityAuthorizationRegistryBatch {
  return {
    [REG_AUTHORIZATION_PROVIDER]: AUTHORIZATION_PROVIDER_SEED_ROWS,
    [REG_CREDENTIAL_TYPE]: CREDENTIAL_TYPE_REGISTRY_SEED_ROWS,
    [REG_CONNECTION_TYPE]: CONNECTION_TYPE_REGISTRY_SEED_ROWS,
    [REG_CONNECTION_POLICY]: CONNECTION_POLICY_SEED_ROWS,
    [REG_IDENTITY_REPORT]: IDENTITY_REPORT_SEED_ROWS,
    [REG_IDENTITY_NOTIFICATION]: IDENTITY_NOTIFICATION_SEED_ROWS,
  };
}

export function getValidatedIdentityAuthorizationRegistryBatch(): IdentityAuthorizationRegistryBatch {
  if (!validatedBatch) {
    const batch = buildSeedBatch();
    validateIdentityAuthorizationRegistryBatch(batch);
    validatedBatch = batch;
  }
  return validatedBatch;
}

export function resetIdentityAuthorizationRegistryBatchForTests(): void {
  validatedBatch = undefined;
}

export function loadIdentityAuthorizationRegistryRows(
  registryId: IdentityAuthorizationRegistryId,
  query?: RegistryQuery,
): IdentityAuthorizationRegistryRowBase[] {
  const batch = getValidatedIdentityAuthorizationRegistryBatch();
  let rows = batch[registryId] ?? [];
  if (query?.registryRowId) {
    rows = rows.filter((row) => row.id === query.registryRowId);
  }
  validateIdentityAuthorizationRegistryRows(registryId, rows);
  return rows;
}

export function listIdentityAuthorizationRegistryFoundationStatus(): Array<{
  registryId: IdentityAuthorizationRegistryId;
  wired: boolean;
  rowCount: number;
}> {
  const batch = getValidatedIdentityAuthorizationRegistryBatch();
  return IDENTITY_AUTHORIZATION_REGISTRY_IDS.map((registryId) => ({
    registryId,
    wired: true,
    rowCount: batch[registryId]?.length ?? 0,
  }));
}
