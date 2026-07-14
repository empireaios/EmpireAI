import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { configureValidationEnvironment } from "../harness.js";
import {
  buildExecutiveDependencyGraph,
  buildExecutiveTimeline,
  applyCardEngineCenterLinks,
} from "../../domain/services/executive-dashboard-integration.js";
import { loadAllEnginePanels } from "../../domain/services/cockpit-panel-views.js";
import { loadDashboardView } from "../../domain/services/module-views.js";

configureValidationEnvironment();

describe("Executive dashboard integration (G4-05)", () => {
  it("builds V1 dependency graph with nodes and edges", () => {
    const panels = loadAllEnginePanels("ws_test");
    const graph = buildExecutiveDependencyGraph(panels);
    assert.ok(graph.nodes.length >= 7);
    assert.ok(graph.edges.length >= 8);
  });

  it("aggregates executive timeline from engine sources", () => {
    const portfolio = loadDashboardView("ws_test");
    const timeline = buildExecutiveTimeline("ws_test", "co-grand-king", portfolio);
    assert.ok(Array.isArray(timeline));
  });

  it("maps summary cards to engine center hrefs", () => {
    const cards = [
      { id: "supplier-status", href: null as string | null },
      { id: "revenue-today", href: null as string | null },
    ];
    applyCardEngineCenterLinks(cards);
    assert.equal(cards[0]?.href, "/cockpit/intelligence/suppliers");
    assert.equal(cards[1]?.href, "/cockpit/finance/profit");
  });
});
