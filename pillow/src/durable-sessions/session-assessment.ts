import { SESSION_LAYER_REGISTRY, getLayersByTier } from "./session-registry.js";
import { PERSISTENCE_MODEL_REGISTRY } from "./persistence-registry.js";
import {
  executeSessionRecovery,
  validateSessionIntegrity,
} from "./session-recovery.js";
import type {
  DurableSessionSnapshot,
  SessionArchitectureAssessment,
} from "./types.js";

function buildGrandKingSummary(input: {
  durable: string[];
  recoverable: string[];
  ephemeral: string[];
  recoveryOk: number;
  recoveryTotal: number;
}): string {
  return [
    `Durable: ${input.durable.join(", ") || "none"}`,
    `Recoverable: ${input.recoverable.join(", ") || "none"}`,
    `Ephemeral (documented): ${input.ephemeral.length} layers`,
    `Recovery: ${input.recoveryOk}/${input.recoveryTotal} layers OK`,
    `Browser refresh: localStorage survives · Auth: Redis required for production durability`,
  ].join(" · ");
}

/** Execute Session Architecture assessment (P5-03). */
export function executeSessionArchitectureAssessment(input: {
  snapshot?: DurableSessionSnapshot | null;
}): SessionArchitectureAssessment {
  const snapshot = input.snapshot ?? null;
  const recoveryResults = snapshot ? executeSessionRecovery({ snapshot }) : [];
  const integrity = snapshot ? validateSessionIntegrity(snapshot) : { valid: true, issues: [] };

  const durableLayers = getLayersByTier("durable").map((l) => l.name);
  const ephemeralLayers = getLayersByTier("ephemeral").map((l) => l.name);
  const recoverableLayers = getLayersByTier("recoverable").map((l) => l.name);

  let overallStatus: SessionArchitectureAssessment["overallStatus"] = "continuity_ok";
  if (!integrity.valid || recoveryResults.some((r) => r.interrupted && !r.recovered)) {
    overallStatus = "degraded";
  }
  if (snapshot?.authStoreMode === "in_memory" && snapshot.nodeEnv === "production") {
    overallStatus = "interrupted";
  }

  const recoveryOk = recoveryResults.filter((r) => r.recovered || r.resumed).length;

  const grandKingSummary = buildGrandKingSummary({
    durable: durableLayers,
    recoverable: recoverableLayers,
    ephemeral: ephemeralLayers,
    recoveryOk,
    recoveryTotal: recoveryResults.length || SESSION_LAYER_REGISTRY.length,
  });

  return {
    pipelineVersion: "P5-03",
    assessedAt: new Date().toISOString(),
    overallStatus,
    durableLayers,
    ephemeralLayers,
    recoverableLayers,
    sessionLayers: SESSION_LAYER_REGISTRY,
    persistenceModels: PERSISTENCE_MODEL_REGISTRY,
    snapshot,
    recoveryResults,
    success:
      SESSION_LAYER_REGISTRY.every((l) => l.recoveryStrategy && l.persistence) &&
      PERSISTENCE_MODEL_REGISTRY.length >= 7,
    summary: `Session Architecture assessed — ${durableLayers.length} durable · ${recoverableLayers.length} recoverable · ${ephemeralLayers.length} ephemeral · integrity ${integrity.valid ? "OK" : "degraded"}`,
    grandKingSummary,
  };
}

export { buildDefaultSessionSnapshot } from "./session-recovery.js";
