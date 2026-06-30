import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDependencyGraph,
  buildIntelligenceCorpus,
  buildRelationshipGraph,
  summarizeGraph,
} from "./graph.js";
import { evaluateRepositoryHealth } from "./health.js";
import type { RepositoryIntelligenceContext } from "./types.js";

export interface RunIntelligenceOptions {
  bootstrap: EmpireBootstrapContext;
}

/**
 * Repository Intelligence Engine (PILLOW-003).
 * Transforms Bootstrap output into structured operational knowledge — read-only.
 */
export async function runRepositoryIntelligence(
  options: RunIntelligenceOptions,
): Promise<RepositoryIntelligenceContext> {
  const started = performance.now();
  const { bootstrap } = options;
  const reader = new RepositoryReader(bootstrap.repositoryRoot);

  const [journey, uxContract, decisions, executiveComponents] =
    await Promise.all([
      reader.readText("JOURNEY.md"),
      reader.readText("UX_IMPLEMENTATION_CONTRACT.md"),
      reader.readText("EMPIREAI_DECISIONS.md"),
      reader.readText("frontend/src/components/system/index.ts"),
    ]);

  const corpus = buildIntelligenceCorpus(bootstrap, {
    journey,
    uxContract,
    decisions,
    executiveComponents,
  });

  const relationships = buildRelationshipGraph(corpus, {
    uxContract,
    decisions,
    journey,
  });

  const dependencies = buildDependencyGraph(relationships, corpus);

  const health = evaluateRepositoryHealth(
    corpus,
    relationships,
    dependencies,
    { uxContract, journey },
  );

  const graphSummary = summarizeGraph(
    corpus.entities,
    relationships,
    dependencies,
  );

  return {
    intelligenceVersion: "PILLOW-003",
    status: "ready",
    completedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    bootstrapVersion: "PILLOW-002",
    entities: corpus.entities,
    relationships,
    dependencies,
    health,
    graphSummary,
  };
}
