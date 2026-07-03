/**
 * EKLS — Store registry maps subsystems to Pillow-governed integration backends.
 * EKLS does not duplicate legacy stores — it governs access to them.
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

import type { EklsSubsystemId } from "../contracts/subsystem-registry.js";

export type EklsStoreBackend = {
  subsystemId: EklsSubsystemId;
  integrationPath: string;
  governance: "pillow-only";
  notes: string;
};

export const EKLS_STORE_REGISTRY: readonly EklsStoreBackend[] = [
  {
    subsystemId: "learning_store",
    integrationPath: "backend/src/orchestration/executive-learning/",
    governance: "pillow-only",
    notes: "Executive Knowledge Base — GK-approved learnings",
  },
  {
    subsystemId: "knowledge_store",
    integrationPath: "backend/src/runtime/empire-knowledge/",
    governance: "pillow-only",
    notes: "Commerce knowledge objects",
  },
  {
    subsystemId: "knowledge_graph",
    integrationPath: "backend/src/runtime/empire-knowledge/services/knowledge-graph-service.ts",
    governance: "pillow-only",
    notes: "Graph edges — queryable, not hardcoded",
  },
  {
    subsystemId: "document_memory",
    integrationPath: "pillow/src/memory/",
    governance: "pillow-only",
    notes: "Repository-derived document memory",
  },
  {
    subsystemId: "observation_store",
    integrationPath: "backend/src/orchestration/executive-learning/ + empire-knowledge learning records",
    governance: "pillow-only",
    notes: "Pending learnings + operational observations",
  },
  {
    subsystemId: "audit_memory",
    integrationPath: "artifacts/",
    governance: "pillow-only",
    notes: "Executive audit artifacts — referenced not duplicated",
  },
  {
    subsystemId: "feature_store",
    integrationPath: "backend/src/orchestration/pillow/ekls/contracts/subsystem-registry.ts",
    governance: "pillow-only",
    notes: "Architecture registry — engines register features",
  },
  {
    subsystemId: "model_store",
    integrationPath: "backend/src/orchestration/pillow/ekls/",
    governance: "pillow-only",
    notes: "Metadata only — no external model weights",
  },
  {
    subsystemId: "outcome_history",
    integrationPath: "backend/src/orchestration/business-automation/outcome/automation-outcome-store.ts",
    governance: "pillow-only",
    notes: "G5-08 automation learning records — Pillow-governed outcome_history backend",
  },
  {
    subsystemId: "vector_memory",
    integrationPath: "reserved",
    governance: "pillow-only",
    notes: "Reserved for future provider-independent vector retrieval",
  },
];

export function resolveStoreBackend(subsystemId: EklsSubsystemId): EklsStoreBackend | undefined {
  return EKLS_STORE_REGISTRY.find((b) => b.subsystemId === subsystemId);
}
