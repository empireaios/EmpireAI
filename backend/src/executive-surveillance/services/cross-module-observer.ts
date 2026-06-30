import { randomUUID } from "node:crypto";

import { buildCisMissionControlDashboard } from "../../runtime/commerce-intelligence-studio/services/cis-mission-control-service.js";
import { buildOperationFirstDollarDashboard } from "../../operation-first-dollar/services/operation-first-dollar-service.js";
import { buildEmpireKnowledgeDashboard } from "../../runtime/empire-knowledge/services/empire-knowledge-dashboard-service.js";
import { buildRealityReadinessDashboard } from "../../orchestration/reality-integration/services/reality-readiness-dashboard-service.js";
import { buildAccessDashboard } from "../../operational-access/services/access-dashboard-service.js";
import { buildSupplierDashboard } from "../../supplier-intelligence/services/supplier-dashboard-service.js";
import { runSupplierWatcher } from "../../supplier-intelligence/services/supplier-surveyor-watcher.js";
import { buildCommerceRuntimeDashboard } from "../../runtime/commerce-runtime/services/commerce-runtime-dashboard-service.js";
import { buildAmazonMissionControlDashboard } from "../../runtime/amazon-global-seller/services/amazon-mission-control-service.js";
import { buildGlobalCommerceInfrastructureDashboard } from "../../runtime/global-commerce-infrastructure/services/global-commerce-infrastructure-dashboard-service.js";
import { buildFounderWorkloadDashboard } from "../../runtime/founder-automation/services/founder-workload-dashboard-service.js";
import { buildExecutiveHeadquartersDashboard } from "../../executive-council/services/executive-headquarters-service.js";
import type { ExecutiveEvidence } from "../models/surveillance-core.js";

export type ModuleObservationSnapshot = {
  moduleId: string;
  label: string;
  summary: string;
  metrics: Record<string, number | string>;
  evidence: ExecutiveEvidence[];
};

/** ESS-008 — Cross-module observation (existing modules only, no duplicate logic). */
export function collectModuleObservations(workspaceId: string, companyId: string): ModuleObservationSnapshot[] {
  const observations: ModuleObservationSnapshot[] = [];
  const now = new Date().toISOString();

  const add = (moduleId: string, label: string, summary: string, metrics: Record<string, number | string>, source: string) => {
    observations.push({
      moduleId,
      label,
      summary,
      metrics,
      evidence: [{ evidenceId: randomUUID(), source, summary, moduleId, recordedAt: now }],
    });
  };

  try {
    const cis = buildCisMissionControlDashboard(workspaceId, companyId);
    add("commerce-intelligence-studio", "Commerce Intelligence Studio", `Commercial confidence ${cis.commercialConfidence}%, ${cis.winningListings.length} winning listings`, {
      commercialConfidence: cis.commercialConfidence,
      awaitingReview: cis.productsAwaitingReview,
      experiments: cis.productsUnderExperiment.length,
    }, "cis-mission-control");
  } catch { /* optional */ }

  try {
    const ofd = buildOperationFirstDollarDashboard(workspaceId, companyId);
    add("operation-first-dollar", "Operation First Dollar", `Phase ${ofd.currentPhase}, ${ofd.milestonesAchieved ?? 0} milestones achieved`, {
      phase: ofd.currentPhase,
      achieved: ofd.milestonesAchieved ?? 0,
    }, "ofd-dashboard");
  } catch { /* optional */ }

  try {
    const ek = buildEmpireKnowledgeDashboard(workspaceId, companyId);
    add("empire-knowledge", "Empire Knowledge", `${ek.knowledgeObjects?.total ?? 0} knowledge objects, ${ek.learningRecords?.total ?? 0} learnings`, {
      objects: ek.knowledgeObjects?.total ?? 0,
      learnings: ek.learningRecords?.total ?? 0,
    }, "empire-knowledge-dashboard");
  } catch { /* optional */ }

  try {
    const rr = buildRealityReadinessDashboard(workspaceId, companyId);
    add("reality-integration", "Reality Integration", `${rr.realCommerceReadinessPercent}% real commerce readiness`, {
      readiness: rr.realCommerceReadinessPercent,
      connected: rr.connectedProviders?.length ?? 0,
    }, "reality-readiness-dashboard");
  } catch { /* optional */ }

  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    add("operational-access", "Operational Access (OAR-001)", `${oar.summary.totalPlatforms} platforms · ${oar.summary.revenueBlockingGaps} revenue gaps`, {
      totalPlatforms: oar.summary.totalPlatforms,
      connected: oar.summary.connected,
      blocked: oar.summary.blocked,
      architectureComplete: oar.architectureComplete ? 1 : 0,
    }, "operational-access-dashboard");
  } catch { /* optional */ }

  try {
    const sup = buildSupplierDashboard(workspaceId, companyId);
    const alerts = runSupplierWatcher(workspaceId, sup);
    add("supplier-intelligence", "Supplier Intelligence (SUP-001)", `${sup.productsFound} products · ${sup.productsUnderReview} under review · ${sup.supplierRisks.length} risks`, {
      productsFound: sup.productsFound,
      underReview: sup.productsUnderReview,
      risks: sup.supplierRisks.length,
      cjReadiness: sup.cjReadiness.overallPercent,
      watcherAlerts: alerts.length,
    }, "supplier-intelligence-dashboard");
  } catch { /* optional */ }

  try {
    const crt = buildCommerceRuntimeDashboard(workspaceId, companyId);
    add("commerce-runtime", "Commerce Runtime", `${crt.runtimePlugins?.length ?? 0} plugins registered`, {
      plugins: crt.runtimePlugins?.length ?? 0,
      queue: crt.executionQueue?.length ?? 0,
    }, "commerce-runtime-dashboard");
  } catch { /* optional */ }

  try {
    const ags = buildAmazonMissionControlDashboard(workspaceId, companyId);
    add("amazon-global-seller", "Amazon Global Seller", `${ags.commercialReadinessPercent}% commercial readiness`, {
      readiness: ags.commercialReadinessPercent,
      ready: ags.productsReady?.length ?? 0,
    }, "amazon-mission-control");
  } catch { /* optional */ }

  try {
    const gci = buildGlobalCommerceInfrastructureDashboard(workspaceId, companyId);
    add("global-commerce-infrastructure", "Global Commerce Infrastructure", `Infrastructure score ${gci.infrastructureScore}%`, {
      score: gci.infrastructureScore,
      critical: gci.criticalMissingPieces?.length ?? 0,
    }, "gci-dashboard");
  } catch { /* optional */ }

  try {
    const fa = buildFounderWorkloadDashboard(workspaceId, companyId);
    add("founder-automation", "Founder Automation", `${fa.automationPercent}% automated, ${fa.waitingForFounder} tasks waiting for founder`, {
      automation: fa.automationPercent,
      waitingFounder: fa.waitingForFounder,
    }, "founder-workload-dashboard");
  } catch { /* optional */ }

  try {
    const ec = buildExecutiveHeadquartersDashboard(workspaceId, companyId);
    add("executive-council", "Executive Council", `${ec.executiveCouncil.activeExecutives} active executives, consensus ${ec.consensus ?? "none"}`, {
      activeExecutives: ec.executiveCouncil.activeExecutives,
      awaitingKing: ec.recommendationsAwaitingKing.length,
    }, "executive-council-headquarters");
  } catch { /* optional */ }

  return observations;
}
