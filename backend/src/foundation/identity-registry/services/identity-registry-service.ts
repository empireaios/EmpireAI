import type {
  IdentityEntity,
  IdentityHistoryEntry,
  IdentityRegisterInput,
  IdentityResolveResult,
} from "../models/identity-entity.js";
import { createDefaultIdentityEntities } from "./identity-default-entities.js";
import { getIdentityDisplayName, resolveIdentityEntity } from "./identity-resolver.js";
import {
  createIdentityHistoryEntry,
  getIdentityRegistryRepository,
} from "../repositories/sqlite-identity-registry-repository.js";

export class IdentityEntityNotFoundError extends Error {
  constructor(canonicalId: string) {
    super(`Identity entity not found: ${canonicalId}`);
    this.name = "IdentityEntityNotFoundError";
  }
}

export class IdentityEntityExistsError extends Error {
  constructor(canonicalId: string) {
    super(`Identity entity already exists: ${canonicalId}`);
    this.name = "IdentityEntityExistsError";
  }
}

function recordHistory(
  entry: Omit<IdentityHistoryEntry, "historyId" | "createdAt">,
): IdentityHistoryEntry {
  return getIdentityRegistryRepository().appendHistory(createIdentityHistoryEntry(entry));
}

/** Idempotent seed of default Empire identity entities. */
export function initializeIdentityRegistry(workspaceId?: string): IdentityEntity[] {
  const repository = getIdentityRegistryRepository();
  const existing = repository.listEntities(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const entities = createDefaultIdentityEntities(workspaceId);
  for (const entity of entities) {
    repository.saveEntity(entity);
    recordHistory({
      canonicalId: entity.canonicalId,
      changeType: "CREATED",
      previousValue: null,
      newValue: entity.displayName,
      summary: `Identity registered: ${entity.displayName}`,
      actor: "identity-registry",
    });
  }

  return entities;
}

export function registerIdentityEntity(input: IdentityRegisterInput): IdentityEntity {
  const repository = getIdentityRegistryRepository();
  if (repository.getEntityByCanonicalId(input.canonicalId)) {
    throw new IdentityEntityExistsError(input.canonicalId);
  }

  const timestamp = new Date().toISOString();
  const entity: IdentityEntity = {
    canonicalId: input.canonicalId,
    entityType: input.entityType,
    displayName: input.displayName,
    aliases: input.aliases ?? [],
    workspaceId: input.workspaceId,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  repository.saveEntity(entity);
  recordHistory({
    canonicalId: entity.canonicalId,
    changeType: "CREATED",
    previousValue: null,
    newValue: entity.displayName,
    summary: `Identity registered: ${entity.displayName}`,
    actor: input.actor ?? "system",
  });

  return entity;
}

export function getIdentityEntity(canonicalId: string): IdentityEntity | null {
  return getIdentityRegistryRepository().getEntityByCanonicalId(canonicalId);
}

export function requireIdentityEntity(canonicalId: string): IdentityEntity {
  const entity = getIdentityEntity(canonicalId);
  if (!entity) {
    throw new IdentityEntityNotFoundError(canonicalId);
  }
  return entity;
}

export function resolveIdentity(query: string, workspaceId?: string): IdentityResolveResult | null {
  const entities = listIdentityEntities(workspaceId);
  return resolveIdentityEntity(query, entities);
}

export function resolveIdentityDisplayName(
  canonicalId: string,
  workspaceId?: string,
  fallback?: string,
): string {
  const entities = listIdentityEntities(workspaceId);
  return getIdentityDisplayName(canonicalId, entities, fallback ?? canonicalId);
}

export function listIdentityEntities(workspaceId?: string): IdentityEntity[] {
  initializeIdentityRegistry(workspaceId);
  return getIdentityRegistryRepository().listEntities(workspaceId);
}

/** Updates display name — canonical ID and architecture remain unchanged. */
export function updateIdentityDisplayName(
  canonicalId: string,
  displayName: string,
  actor = "system",
): IdentityEntity {
  const repository = getIdentityRegistryRepository();
  const existing = repository.getEntityByCanonicalId(canonicalId);
  if (!existing) {
    throw new IdentityEntityNotFoundError(canonicalId);
  }

  const updated: IdentityEntity = {
    ...existing,
    displayName,
    updatedAt: new Date().toISOString(),
  };

  repository.saveEntity(updated);
  recordHistory({
    canonicalId,
    changeType: "DISPLAY_NAME",
    previousValue: existing.displayName,
    newValue: displayName,
    summary: `Display name changed: ${existing.displayName} → ${displayName}`,
    actor,
  });

  return updated;
}

export function addIdentityAlias(
  canonicalId: string,
  alias: string,
  actor = "system",
): IdentityEntity {
  const repository = getIdentityRegistryRepository();
  const existing = repository.getEntityByCanonicalId(canonicalId);
  if (!existing) {
    throw new IdentityEntityNotFoundError(canonicalId);
  }

  if (existing.aliases.includes(alias)) {
    return existing;
  }

  const updated: IdentityEntity = {
    ...existing,
    aliases: [...existing.aliases, alias],
    updatedAt: new Date().toISOString(),
  };

  repository.saveEntity(updated);
  recordHistory({
    canonicalId,
    changeType: "ALIAS_ADDED",
    previousValue: null,
    newValue: alias,
    summary: `Alias added: ${alias}`,
    actor,
  });

  return updated;
}

export function removeIdentityAlias(
  canonicalId: string,
  alias: string,
  actor = "system",
): IdentityEntity {
  const repository = getIdentityRegistryRepository();
  const existing = repository.getEntityByCanonicalId(canonicalId);
  if (!existing) {
    throw new IdentityEntityNotFoundError(canonicalId);
  }

  const updated: IdentityEntity = {
    ...existing,
    aliases: existing.aliases.filter((entry) => entry !== alias),
    updatedAt: new Date().toISOString(),
  };

  repository.saveEntity(updated);
  recordHistory({
    canonicalId,
    changeType: "ALIAS_REMOVED",
    previousValue: alias,
    newValue: null,
    summary: `Alias removed: ${alias}`,
    actor,
  });

  return updated;
}

export function listIdentityHistory(canonicalId: string, limit = 100): IdentityHistoryEntry[] {
  return getIdentityRegistryRepository().listHistory(canonicalId, limit);
}
