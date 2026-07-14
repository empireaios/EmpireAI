import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  loadExecutiveRelationshipGraphView,
  type ExecutiveRelationshipGraphView,
} from "../../domain/services/executive-relationship-graph.js";
import { V1_ENGINE_IDS } from "../../domain/services/executive-dashboard-integration.js";
import { ENGINE_CENTER_ROUTES } from "../../domain/services/engine-center-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G4-08 — Executive Relationship Graph", () => {
  it("returns nine V1 engine nodes with navigation routes", () => {
    const graph = loadExecutiveRelationshipGraphView("ws_g408");
    const engines = graph.nodes.filter((n) => n.kind === "engine");
    assert.equal(engines.length, V1_ENGINE_IDS.length);
    for (const engineId of V1_ENGINE_IDS) {
      const node = engines.find((n) => n.engineId === engineId);
      assert.ok(node, `missing node for ${engineId}`);
      assert.equal(node.route, ENGINE_CENTER_ROUTES[engineId]);
      assert.equal(node.id, `engine:${engineId}`);
    }
  });

  it("includes dependency, mission, and blocker relationship edges", () => {
    const graph = loadExecutiveRelationshipGraphView("ws_g408");
    assert.ok(graph.edges.some((e) => e.kind === "depends_on"));
    assert.ok(graph.edges.some((e) => e.kind === "upstream"));
    assert.ok(graph.edges.some((e) => e.kind === "downstream"));
    assert.equal(graph.schemaVersion, "g4-08-v1");
    assert.ok(graph.summary.dependencyEdges >= 8);
  });

  it("enriches nodes with upstream/downstream refs and health", () => {
    const graph = loadExecutiveRelationshipGraphView("ws_g408");
    const storefront = graph.nodes.find((n) => n.engineId === "storefront");
    assert.ok(storefront);
    assert.ok(Array.isArray(storefront.upstream));
    assert.ok(Array.isArray(storefront.downstream));
    assert.ok(typeof storefront.health === "string");
    assert.ok(Array.isArray(storefront.activeMissions));
    assert.ok(Array.isArray(storefront.blockingIssues));
  });

  it("documents future expansion node kinds without live nodes", () => {
    const graph: ExecutiveRelationshipGraphView = loadExecutiveRelationshipGraphView("ws_g408");
    assert.ok(graph.futureExpansion.nodeKinds.includes("company"));
    assert.ok(graph.futureExpansion.nodeKinds.includes("brand"));
    assert.ok(graph.futureExpansion.nodeKinds.includes("product"));
    const futureLive = graph.nodes.filter((n) => n.kind !== "engine");
    assert.equal(futureLive.length, 0);
  });
});
