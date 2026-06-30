import { randomUUID } from "node:crypto";

import type { KnowledgeObject } from "../models/knowledge-object.js";
import { CreateKnowledgeObjectInputSchema } from "../models/knowledge-object.js";
import type { CreateKnowledgeObjectInput } from "../models/knowledge-object.js";
import { KNOWLEDGE_SEED_OBJECTS } from "../data/knowledge-seed-data.js";
import { getEmpireKnowledgeRepository } from "../repositories/sqlite-empire-knowledge-repository.js";
import { buildGlobalCommerceRegistry } from "../../global-commerce/index.js";

function nowIso(): string {
  return new Date().toISOString();
}

/** Bootstrap seed + registry-linked objects for unlimited entity support. */
export function ensureKnowledgeSeeded(workspaceId: string, companyId?: string): void {
  const repo = getEmpireKnowledgeRepository();
  if (repo.isSeeded(workspaceId)) return;

  const ts = nowIso();
  for (const seed of KNOWLEDGE_SEED_OBJECTS) {
    const obj: KnowledgeObject = {
      objectId: seed.objectId,
      objectType: seed.objectType,
      workspaceId,
      companyId: seed.objectType === "business" ? companyId : seed.companyId,
      displayName: seed.displayName,
      externalRef: seed.externalRef,
      attributes: seed.attributes ?? {},
      tags: seed.tags ?? [],
      confidence: seed.confidence ?? 50,
      source: seed.source ?? "SEED",
      createdAt: ts,
      updatedAt: ts,
    };
    repo.saveObject(obj);
  }

  const registry = buildGlobalCommerceRegistry();
  for (const country of registry.countries) {
    const objectId = `ko-country-${country.countryCode.toLowerCase()}`;
    if (repo.getObject(objectId)) continue;
    repo.saveObject({
      objectId,
      objectType: "country",
      workspaceId,
      displayName: country.displayName,
      externalRef: country.countryCode,
      attributes: { regionId: country.regionId, currency: country.currency, languages: country.languages },
      tags: ["country", country.regionId],
      confidence: 55,
      source: "INTELLIGENCE",
      createdAt: ts,
      updatedAt: ts,
    });
  }
}

/** K-001 — Knowledge Object Model. */
export function createKnowledgeObject(
  workspaceId: string,
  input: CreateKnowledgeObjectInput,
): KnowledgeObject {
  ensureKnowledgeSeeded(workspaceId, input.companyId);
  const parsed = CreateKnowledgeObjectInputSchema.parse(input);
  const ts = nowIso();
  const obj: KnowledgeObject = {
    objectId: randomUUID(),
    objectType: parsed.objectType,
    workspaceId,
    companyId: parsed.companyId,
    displayName: parsed.displayName,
    externalRef: parsed.externalRef,
    attributes: parsed.attributes ?? {},
    tags: parsed.tags ?? [],
    confidence: parsed.confidence,
    source: parsed.source,
    createdAt: ts,
    updatedAt: ts,
  };
  getEmpireKnowledgeRepository().saveObject(obj);
  return obj;
}

export function getKnowledgeObject(objectId: string): KnowledgeObject | null {
  return getEmpireKnowledgeRepository().getObject(objectId);
}

export function listKnowledgeObjects(workspaceId: string, objectType?: string): KnowledgeObject[] {
  ensureKnowledgeSeeded(workspaceId);
  return getEmpireKnowledgeRepository().listObjects(workspaceId, objectType);
}

export function countKnowledgeObjectsByType(workspaceId: string): Record<string, number> {
  ensureKnowledgeSeeded(workspaceId);
  const objects = getEmpireKnowledgeRepository().listObjects(workspaceId);
  const counts: Record<string, number> = {};
  for (const obj of objects) {
    counts[obj.objectType] = (counts[obj.objectType] ?? 0) + 1;
  }
  return counts;
}

export function findKnowledgeObjectsByTag(workspaceId: string, tag: string): KnowledgeObject[] {
  return listKnowledgeObjects(workspaceId).filter((o) => o.tags.includes(tag));
}

export function findKnowledgeObjectsByCategory(workspaceId: string, category: string): KnowledgeObject[] {
  return listKnowledgeObjects(workspaceId).filter(
    (o) => String(o.attributes.category ?? "").toLowerCase() === category.toLowerCase(),
  );
}
