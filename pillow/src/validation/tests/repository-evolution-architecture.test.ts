import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  assembleRepositoryEvolutionArchitecture,
  buildFallbackRepositoryEvolutionArchitecture,
  REPOSITORY_EVOLUTION_PIPELINE,
  EVOLUTION_PRINCIPLES,
  GOVERNED_DOMAINS,
} from "../../repository-evolution-architecture/index.js";

describe("P9-01 Repository Evolution Architecture", () => {
  test("buildFallbackRepositoryEvolutionArchitecture returns constitutional evolution model", () => {
    const view = buildFallbackRepositoryEvolutionArchitecture();
    assert.equal(view.architectureVersion, "P9-01");
    assert.ok(view.evolutionPipeline.length === REPOSITORY_EVOLUTION_PIPELINE.length);
    assert.deepEqual(view.evolutionPrinciples, [...EVOLUTION_PRINCIPLES]);
    assert.deepEqual(view.governedDomains, [...GOVERNED_DOMAINS]);
    assert.ok(view.recommendations.length >= 1);
    assert.ok(view.evolutionQueue.length === view.currentImprovements.length);
    assert.equal(view.canonicalIntegrity.includes("validated") || view.canonicalIntegrity.includes("drift"), true);
    assert.equal(view.repositoryHealthMetrics.length, 11);
    assert.equal(view.driftDetection.length, 10);
  });

  test("assembleRepositoryEvolutionArchitecture consolidates health and snapshot", () => {
    const view = assembleRepositoryEvolutionArchitecture({
      repositoryHealth: {
        score: 88,
        issues: [
          {
            code: "ARCHITECTURE_DRIFT",
            severity: "warning",
            message: "Component boundary drift detected",
            recommendation: "Run impact analysis before refactor",
          },
        ],
        indicators: {
          totalEntities: 120,
          missingOwnerReferences: 0,
          brokenDependencyChains: 0,
          duplicateOwnership: 1,
          orphanedArtifacts: 0,
          architectureDriftSignals: 1,
          missingJourneyReferences: 0,
          missingDocumentation: 2,
        },
      },
      repositorySnapshot: {
        computedAt: new Date().toISOString(),
        version: "PILLOW-RI-002",
        inventorySummary: "12 packages · 45 components",
        componentCount: 45,
        folderCount: 80,
        fileCount: 200,
        flowCount: 12,
        hotspotCount: 2,
        circularDependencyCount: 0,
        criticalComponents: [],
        executionFlows: [],
        dependencyHotspots: [{ id: "commerce-bridge", score: 72, reason: "High coupling" }],
        inventory: {
          topLevelFolders: [],
          packages: [],
          services: [],
          apis: [],
          uiAreas: [],
          businessEngines: [],
          pillowModules: [],
          infrastructure: [],
          tests: [],
          documentation: [],
        },
        components: [],
        folders: [],
        files: [],
        dependencyGraph: {
          nodes: [],
          edges: [],
          incoming: {},
          outgoing: {},
          circularDependencies: [],
          unusedComponents: ["legacy-bridge"],
          duplicatedResponsibilities: ["duplicate commerce paths"],
          architecturalHotspots: [],
        },
        searchIndex: [],
        grandKingSummary: "Repository intelligence active",
      },
    });

    assert.equal(view.healthScore, 88);
    assert.equal(view.documentationHealth, "2 documentation gaps");
    assert.ok(view.driftSignals.length >= 1);
    assert.ok(view.recommendations.some((r) => r.domain.includes("architecture")));
    assert.equal(view.integrations.repositoryIntelligence, "PILLOW-RI-002 · PILLOW-RI-002");
  });
});
