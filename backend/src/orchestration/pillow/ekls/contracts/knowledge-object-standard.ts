/**
 * EKLS — Canonical Knowledge Object Standard.
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

export const EKLS_SCHEMA_VERSION = "ekls-v1" as const;

export type EklsLifecycleState =
  | "discovered"
  | "validated"
  | "stored"
  | "linked"
  | "active"
  | "superseded"
  | "archived"
  | "retired";

export type EklsQualityState = "draft" | "verified" | "degraded" | "quarantined";

export type EklsGovernanceState = "pending" | "pillow-approved" | "pillow-rejected" | "pillow-governed";

/** Every EKLS stored object exposes this contract. */
export type EklsKnowledgeObject = {
  schemaVersion: typeof EKLS_SCHEMA_VERSION;
  objectId: string;
  workspaceId: string;
  companyId: string | null;
  brandId: string | null;
  categoryId: string | null;
  objectType: string;
  source: string;
  timestamp: string;
  version: number;
  confidence: number;
  evidenceRefs: string[];
  relationshipRefs: string[];
  lifecycleState: EklsLifecycleState;
  qualityState: EklsQualityState;
  governanceState: EklsGovernanceState;
  owner: "pillow";
  revisionHistory: Array<{ version: number; changedAt: string; summary: string }>;
};

export const EKLS_REQUIRED_FIELDS: readonly (keyof EklsKnowledgeObject)[] = [
  "objectId",
  "workspaceId",
  "objectType",
  "source",
  "timestamp",
  "version",
  "confidence",
  "lifecycleState",
  "qualityState",
  "governanceState",
  "owner",
] as const;

export function assertEklsKnowledgeObjectShape(
  value: Partial<EklsKnowledgeObject>,
): value is EklsKnowledgeObject {
  return EKLS_REQUIRED_FIELDS.every((field) => value[field] !== undefined && value[field] !== null);
}
