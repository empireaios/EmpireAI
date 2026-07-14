import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  G3_08_CAPABILITIES,
  buildRiskIntelligenceDiscoveryView,
  buildRiskIntelligenceEngineArchitecture,
  loadRiskIntelligenceEngineView,
  rankRiskAnalysisContracts,
  resolveRegistryDiscoveredRisks,
} from "../../intelligence/risk-intelligence-engine/engine-architecture.js";
import { loadRiskIntelligenceEngineViewForWorkspace } from "../../domain/services/risk-intelligence-engine-views.js";
import { loadRiskIntelligenceEnginePanel } from "../../domain/services/cockpit-panel-views.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3-08 — Risk Intelligence Engine (architecture)", () => {
  it("discovers risk surfaces from RegistryLoader (not hardcoded in engine)", () => {
    const arch = buildRiskIntelligenceEngineArchitecture();
    assert.equal(arch.schemaVersion, "g3-08-v1");
    assert.equal(arch.missionRef, "G3-08");
    assert.ok(arch.scopeGate.includes("no live"));
    assert.ok(arch.riskDiscovery.marketplaceProviders.length > 0);
    assert.ok(arch.riskDiscovery.policyProviders.length >= 2);
    assert.equal(G3_08_CAPABILITIES.length, 6);
  });

  it("integrates with Market, Supplier, Financial intelligence and Guardian", () => {
    const arch = buildRiskIntelligenceEngineArchitecture();
    const engineIds = arch.integrations.map((i) => i.engineId);
    assert.ok(engineIds.includes("market-intelligence-engine"));
    assert.ok(engineIds.includes("supplier-intelligence-engine"));
    assert.ok(engineIds.includes("financial-intelligence-engine"));
    assert.ok(engineIds.includes("guardian"));
  });

  it("maps risks to analysis contract with score, severity, and mitigation", () => {
    const view = loadRiskIntelligenceEngineViewForWorkspace("ws_g308");
    assert.ok(view.assessedRisks.length > 0);
    const risk = view.assessedRisks[0]!;
    assert.ok(typeof risk.riskScore === "number");
    assert.ok(typeof risk.probability === "number");
    assert.ok(typeof risk.confidence === "number");
    assert.ok(risk.mitigation);
    assert.ok(risk.recommendedAction);
    assert.ok(["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(risk.severity));
    assert.ok(Array.isArray(risk.supportingEvidence));
    assert.ok(
      [
        "marketplace_risk",
        "supplier_risk",
        "financial_risk",
        "operational_risk",
        "policy_risk",
        "growth_risk",
      ].includes(risk.riskCategory),
    );
  });

  it("includes registry architecture risks when cross-engine data sparse", () => {
    const discovery = buildRiskIntelligenceDiscoveryView();
    const units = resolveRegistryDiscoveredRisks("ws_empty_g308", discovery);
    assert.ok(units.some((u) => u.source === "registry-architecture"));
  });

  it("ranks risks by composite risk score", () => {
    const view = loadRiskIntelligenceEngineView("ws_g308");
    const ranked = rankRiskAnalysisContracts(view.assessedRisks);
    if (ranked.length >= 2) {
      const a = ranked[0]!;
      const b = ranked[1]!;
      const scoreA = a.riskScore * 0.5 + a.probability * 0.35 + (100 - a.confidence) * 0.05;
      const scoreB = b.riskScore * 0.5 + b.probability * 0.35 + (100 - b.confidence) * 0.05;
      assert.ok(scoreA >= scoreB);
    }
  });

  it("wires cockpit risk intelligence panel to G3-08 artifact ref", () => {
    const panel = loadRiskIntelligenceEnginePanel("ws_g308");
    assert.equal(panel.displayName, "Risk Intelligence Engine");
    assert.equal(
      panel.executiveAudit.artifactRef,
      "artifacts/g3-08-risk-intelligence-engine-executive-audit.md",
    );
    assert.ok(panel.dependencies.length >= 4);
    assert.ok(panel.metrics?.some((m) => m.label === "Risks assessed"));
  });

  it("loads GDPR and Amazon Seller Policy from policy registry catalog", () => {
    const discovery = buildRiskIntelligenceDiscoveryView();
    const ids = discovery.policyProviders.map((p) => p.providerId);
    assert.ok(ids.includes("gdpr-eu-policy"));
    assert.ok(ids.includes("amazon-seller-policy"));
  });
});
