import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { resetDatabaseInstance } from "../../brain/database.js";
import {
  buildCountryInfrastructureProfile,
  buildExpansionDependencyGraph,
  buildGlobalCommerceInfrastructureDashboard,
  computeInfrastructureReadiness,
  getProviderDependencies,
  listCountryInfrastructureProfiles,
} from "../../runtime/global-commerce-infrastructure/index.js";
import { buildOrLoadGlobalCommerceIdentity, resetGlobalCommerceRepository } from "../../runtime/global-commerce/index.js";
import { resetGlobalCommerceIntelligenceRepository } from "../../runtime/global-commerce-intelligence/index.js";
import { resetEmpireKnowledgeRepository } from "../../runtime/empire-knowledge/index.js";
import { resetRuntimePluginRegistry } from "../../runtime/plugins/index.js";
import { configureValidationEnvironment } from "../harness.js";

const WORKSPACE_ID = "ws-d001";
const COMPANY_ID = "co-grand-king";

describe("Program Delta — Global Commerce Infrastructure (D-001–D-005)", () => {
  beforeEach(() => {
    configureValidationEnvironment();
    resetDatabaseInstance();
    resetGlobalCommerceRepository();
    resetGlobalCommerceIntelligenceRepository();
    resetEmpireKnowledgeRepository();
    resetRuntimePluginRegistry();
  });

  afterEach(() => {
    resetGlobalCommerceRepository();
    resetGlobalCommerceIntelligenceRepository();
    resetEmpireKnowledgeRepository();
    resetRuntimePluginRegistry();
    resetDatabaseInstance();
  });

  it("D-001 — infrastructure model defines 12 layers per country", () => {
    const profiles = listCountryInfrastructureProfiles();
    assert.equal(profiles.length, 19);

    const sg = buildCountryInfrastructureProfile("SG");
    assert.ok(sg);
    assert.equal(sg!.layers.length, 12);
    assert.ok(sg!.layers.some((l) => l.layerId === "marketplace"));
    assert.ok(sg!.layers.some((l) => l.layerId === "payment"));
    assert.ok(sg!.layers.some((l) => l.layerId === "compliance"));
    assert.ok(sg!.infrastructureScore >= 0);
  });

  it("D-002 — Shopee SG dependencies match mission requirements", () => {
    const deps = getProviderDependencies("shopee-sg", "SG");
    assert.ok(deps);
    assert.ok(deps!.dependencies.length >= 6);

    const bizReg = deps!.dependencies.find((d) => d.component.includes("Business Registration"));
    assert.ok(bizReg);
    assert.equal(bizReg!.requirement, "NOT_REQUIRED");

    const stripe = deps!.dependencies.find((d) => d.component === "Stripe");
    assert.ok(stripe);
    assert.equal(stripe!.requirement, "NOT_REQUIRED");

    const localPay = deps!.dependencies.find((d) => d.component.includes("Local Payment"));
    assert.ok(localPay);
    assert.equal(localPay!.requirement, "REQUIRED");

    const logistics = deps!.dependencies.find((d) => d.layerId === "logistics");
    assert.ok(logistics);
    assert.equal(logistics!.requirement, "RECOMMENDED");
  });

  it("D-003 — infrastructure readiness computes score and blockers", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const readiness = computeInfrastructureReadiness(WORKSPACE_ID, COMPANY_ID, "SG");
    assert.ok(readiness);
    assert.ok(readiness!.infrastructureScore >= 0);
    assert.ok(Array.isArray(readiness!.missingComponents));
    assert.ok(Array.isArray(readiness!.criticalBlockers));
    assert.ok(readiness!.automationPotential >= 0);
    assert.ok(readiness!.humanWorkRemainingHours >= 0);
    assert.ok(["READY", "NEARLY_READY", "IN_PROGRESS", "BLOCKED"].includes(readiness!.readinessPhase));
  });

  it("D-004 — expansion dependency graph chains country to ready", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const graph = buildExpansionDependencyGraph(WORKSPACE_ID, COMPANY_ID, "SG", "shopee-sg");
    assert.ok(graph);
    assert.ok(graph!.nodes.length >= 8);
    assert.ok(graph!.edges.length >= 7);
    assert.ok(graph!.nodes.some((n) => n.nodeType === "country"));
    assert.ok(graph!.nodes.some((n) => n.nodeType === "marketplace"));
    assert.ok(graph!.nodes.some((n) => n.nodeType === "ready"));
    assert.ok(graph!.nodes.some((n) => n.nodeType === "payment"));
  });

  it("D-005 — infrastructure dashboard exposes Mission Control payload", () => {
    buildOrLoadGlobalCommerceIdentity({ workspaceId: WORKSPACE_ID, companyId: COMPANY_ID });
    const dashboard = buildGlobalCommerceInfrastructureDashboard(WORKSPACE_ID, COMPANY_ID);

    assert.equal(dashboard.moduleId, "global-commerce-infrastructure");
    assert.equal(dashboard.missionId, "D-001-D-005");
    assert.ok(dashboard.infrastructureScore >= 0);
    assert.ok(dashboard.infrastructureHeatmap.length === 19);
    assert.equal(dashboard.infrastructureCoverage.countriesEvaluated, 19);
    assert.equal(dashboard.infrastructureCoverage.layersTracked, 12);
    assert.ok(dashboard.expansionDependencies.length > 0);
  });
});
