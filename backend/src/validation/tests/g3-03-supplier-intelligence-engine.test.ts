import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_03_CAPABILITIES,
  buildSupplierIntelligenceEngineArchitecture,
  loadSupplierIntelligenceEngineView,
  rankSupplierAnalysisContracts,
  buildSupplierComparison,
  resolveRegistryDiscoveredSuppliers,
} from "../../intelligence/supplier-intelligence-engine/engine-architecture.js";
import { loadSupplierIntelligenceEngineViewForWorkspace } from "../../domain/services/supplier-intelligence-engine-views.js";
import { loadSupplierIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-03 — Supplier Intelligence Engine (architecture)", () => {
  it("discovers suppliers from RegistryLoader (not hardcoded in engine)", () => {
    const arch = buildSupplierIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-03-v1");
    assert.equal(arch.missionRef, "G3-03");
    assert.ok(arch.scopeGate.includes("no live"));
    assert.ok(arch.supplierDiscovery.supplierProviders.length > 0);
    assert.ok(arch.discoveredSupplierCount > 0);
    assert.equal(G3_03_CAPABILITIES.length, 10);
    assert.equal(arch.supplierDiscovery.registrySource, "RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT");
  });

  it("integrates with five executive AI engines", () => {
    const arch = buildSupplierIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    assert.ok(engineIds.includes("supplier-engine"));
    assert.ok(engineIds.includes("marketplace-engine"));
    assert.ok(engineIds.includes("product-intelligence-engine"));
    assert.ok(engineIds.includes("quantitative-intelligence-engine"));
    assert.ok(engineIds.includes("logistics-engine"));
    assert.ok(arch.dataFlow.length >= 5);
  });

  it("maps registry suppliers to six-field analysis contract", () => {
    const view = loadSupplierIntelligenceEngineViewForWorkspace("ws_g303");
    assert.ok(view.analysedSuppliers.length > 0);
    const supplier = view.analysedSuppliers[0]!;
    assert.ok(typeof supplier.supplierScore === "number");
    assert.ok(typeof supplier.reliability === "number");
    assert.ok(typeof supplier.risk === "number");
    assert.ok(typeof supplier.confidence === "number");
    assert.ok(Array.isArray(supplier.supportingEvidence));
    assert.ok(supplier.recommendedAction);
    assert.ok(["SELL", "REVIEW", "REJECT"].includes(supplier.recommendation));
  });

  it("ranks suppliers by composite score", () => {
    const view = loadSupplierIntelligenceEngineView();
    const ranked = rankSupplierAnalysisContracts(view.analysedSuppliers);
    if (ranked.length >= 2) {
      const a = ranked[0]!;
      const b = ranked[1]!;
      const scoreA = a.supplierScore * 0.5 + a.reliability * 0.25 - a.risk * 0.25;
      const scoreB = b.supplierScore * 0.5 + b.reliability * 0.25 - b.risk * 0.25;
      assert.ok(scoreA >= scoreB);
    }
  });

  it("builds supplier comparison board", () => {
    const view = loadSupplierIntelligenceEngineView();
    const comparison = buildSupplierComparison(view.analysedSuppliers);
    assert.equal(comparison.length, view.analysedSuppliers.length);
    assert.equal(comparison[0]?.rank, 1);
  });

  it("wires cockpit supplier intelligence panel to G3-03 artifact ref", () => {
    const panel = loadSupplierIntelligenceEnginePanel("ws_g303");
    assert.equal(panel.displayName, "Supplier Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-03-supplier-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 5);
    assert.ok(panel.metrics?.some((m) => m.label === "Suppliers analysed"));
  });

  it("matches registry CJ supplier to catalog overlay", () => {
    const discovered = resolveRegistryDiscoveredSuppliers();
    const cj = discovered.find((d) => d.registryId === "cj-global" || d.connectorRef === "cj-dropshipping");
    assert.ok(cj, "expected registry CJ supplier in discovery snapshot");
    assert.equal(cj.source, "registry-catalog");
  });
});
