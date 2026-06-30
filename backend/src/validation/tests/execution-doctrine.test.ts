import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CANONICAL_DOCTRINE_IDS } from "../../foundation/doctrine-engine/models/doctrine.js";
import {
  createExecutionDoctrineCompliance,
  buildExecutionTrace,
  buildExplainableRecommendation,
  EA_EXECUTION_PRINCIPLES,
  prioritizeGrandKingAccount,
} from "../../orchestration/ecommerce-os-orchestrator/models/execution-doctrine.js";
import { createBusinessSimulationEngineModuleContract } from "../../orchestration/business-simulation-engine/contract/business-simulation-module.js";

describe("EA Execution Doctrine", () => {
  it("defines canonical doctrine ID and eight principles", () => {
    assert.equal(CANONICAL_DOCTRINE_IDS.EA_EXECUTION, "doctrine:ea-execution");
    assert.equal(EA_EXECUTION_PRINCIPLES.length, 8);
    assert.ok(EA_EXECUTION_PRINCIPLES.includes("GRAND_KING_ACCOUNT_FIRST"));
    assert.ok(EA_EXECUTION_PRINCIPLES.includes("TRACEABILITY"));
  });

  it("builds execution trace with input and output packages", () => {
    const trace = buildExecutionTrace({
      inputPackages: [
        { engineId: "business-build-engine", packageId: "build:1", packageType: "BusinessBuildPackage" },
      ],
      outputPackage: {
        engineId: "business-simulation-engine",
        packageId: "sim:1",
        packageType: "BusinessSimulationRecord",
      },
      decisionSource: "READY_FOR_LAUNCH",
      responsibleEngine: "business-simulation-engine",
      confidence: 82,
    });

    assert.equal(trace.doctrineReference, CANONICAL_DOCTRINE_IDS.EA_EXECUTION);
    assert.equal(trace.inputPackages.length, 1);
    assert.equal(trace.accountType, "grand_king");
    assert.equal(trace.confidence, 82);
  });

  it("builds explainable recommendation with intelligence sources", () => {
    const explanation = buildExplainableRecommendation({
      why: "Strong projected ROI",
      intelligenceSources: ["LIVE-009:business-build-package"],
      confidence: 75,
      risks: ["Supplier dependency"],
      alternatives: ["Defer launch"],
    });

    assert.ok(explanation.why.length > 0);
    assert.ok(explanation.intelligenceSources.length > 0);
    assert.ok(explanation.alternatives.length > 0);
  });

  it("prioritizes Grand King's Account in design decisions", () => {
    assert.equal(prioritizeGrandKingAccount("grand_king", "founder"), "grand_king");
  });

  it("declares execution doctrine compliance on LIVE-010 module contract", () => {
    const contract = createBusinessSimulationEngineModuleContract();
    assert.ok(contract.executionDoctrine);
    assert.equal(contract.executionDoctrine.doctrineId, CANONICAL_DOCTRINE_IDS.EA_EXECUTION);
    assert.equal(contract.executionDoctrine.appliesFromMission, "LIVE-010");
    assert.equal(contract.executionDoctrine.irreversibleActionsBlocked, true);
  });

  it("creates reusable compliance declaration for future LIVE missions", () => {
    const compliance = createExecutionDoctrineCompliance("LIVE-011");
    assert.equal(compliance.appliesFromMission, "LIVE-011");
    assert.equal(compliance.principles.length, 8);
  });
});
