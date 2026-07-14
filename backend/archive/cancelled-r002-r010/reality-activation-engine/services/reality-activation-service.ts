import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import { buildCommerceReadinessDashboard } from "../../commerce-readiness-engine/index.js";
import { buildExecutionLayerDashboard } from "../../execution-layer/index.js";
import { buildRealityIntegrationDashboard, buildConnectorHealthCenter } from "../../reality-integration/index.js";
import { buildEsisDashboard } from "../../empire-self-inspection/index.js";
import { getInfrastructureConnectionStatus } from "../../marketplace-infrastructure-engine/index.js";
import type { ActivationDecision, ActivationState, RealityActivationDashboard } from "../models/reality-activation.js";
import { getRealityActivationRepository } from "../repositories/sqlite-reality-activation-repository.js";

export type EvaluateActivationInput = {
  workspaceId: string;
  companyId: string;
  accountType?: "grand_king" | "founder";
};

function healthLabel(score: number): string {
  if (score >= 80) return "HEALTHY";
  if (score >= 50) return "WARNING";
  return "FAILED";
}

export function evaluateRealityActivation(input: EvaluateActivationInput): ActivationDecision {
  const { workspaceId, companyId } = input;
  const repo = getRealityActivationRepository();

  if (repo.isEmergencyStop(workspaceId, companyId)) {
    return repo.saveDecision(buildDecision(input, "EMERGENCY_STOP", 0, [{
      id: "emergency_stop",
      category: "governance",
      severity: "BLOCKING",
      title: "Emergency stop active",
      description: "Reality activation halted by emergency stop",
    }]));
  }

  const readiness = buildCommerceReadinessDashboard({
    workspaceId,
    companyId,
    accountType: input.accountType ?? "grand_king",
  });
  const reality = buildRealityIntegrationDashboard(workspaceId, companyId);
  const execution = buildExecutionLayerDashboard(workspaceId, companyId);
  const esis = buildEsisDashboard(workspaceId, companyId);
  const healthCenter = buildConnectorHealthCenter(workspaceId);

  const stripeStatus = getInfrastructureConnectionStatus(workspaceId, "stripe");
  const cjStatus = getInfrastructureConnectionStatus(workspaceId, "cj-dropshipping");
  const shopifyStatus = getInfrastructureConnectionStatus(workspaceId, "shopify");

  const blockers: ActivationDecision["blockers"] = [];

  for (const item of readiness.blockingItems) {
    blockers.push({
      id: item.id,
      category: item.category,
      severity: item.severity === "BLOCKING" ? "BLOCKING" : item.severity === "WARNING" ? "WARNING" : "INFO",
      title: item.title,
      description: item.description,
    });
  }

  if (stripeStatus !== "CONNECTED") {
    blockers.push({
      id: "payment-stripe",
      category: "payment",
      severity: "BLOCKING",
      title: "Stripe not connected",
      description: "Payment health requires Stripe CONNECTED",
    });
  }
  if (cjStatus !== "CONNECTED") {
    blockers.push({
      id: "supplier-cj",
      category: "supplier",
      severity: "WARNING",
      title: "CJ not connected",
      description: "Supplier health degraded until CJ connected",
    });
  }
  if (shopifyStatus !== "CONNECTED") {
    blockers.push({
      id: "marketplace-shopify",
      category: "marketplace",
      severity: "BLOCKING",
      title: "Shopify not connected",
      description: "Marketplace health requires Shopify CONNECTED for first sale path",
    });
  }
  if (healthCenter.failed > 0) {
    blockers.push({
      id: "connector-health",
      category: "connector",
      severity: "WARNING",
      title: "Connector health failures",
      description: `${healthCenter.failed} connectors in FAILED state`,
    });
  }
  if (esis.systemHealth.state === "FAILED") {
    blockers.push({
      id: "esis-health",
      category: "esis",
      severity: "WARNING",
      title: "ESIS system health failed",
      description: esis.systemHealth.summary,
    });
  }

  blockers.push({
    id: "project-reality-gate",
    category: "governance",
    severity: "BLOCKING",
    title: "Project Reality execution gate",
    description: "Live execution remains blocked until Reality Activation approves LIVE (architecture phase R002–R010)",
  });

  const blockingCount = blockers.filter((b) => b.severity === "BLOCKING").length;
  const warningCount = blockers.filter((b) => b.severity === "WARNING").length;

  let state: ActivationState = "NOT_READY";
  let confidence = Math.max(0, readiness.overallReadinessScore - blockingCount * 15 - warningCount * 5);

  if (blockingCount === 1 && blockers.every((b) => b.id === "project-reality-gate")) {
    state = "READY_FOR_STAGING";
    confidence = Math.min(85, readiness.overallReadinessScore);
  } else if (blockingCount === 0) {
    state = "READY_FOR_LIVE";
    confidence = Math.min(95, readiness.overallReadinessScore);
  } else if (blockingCount <= 2 && readiness.launchDecision === "READY_WITH_WARNINGS") {
    state = "READY_FOR_STAGING";
  }

  const decision = buildDecision(input, state, confidence, blockers, {
    commerceReadiness: readiness.launchDecision,
    connectorHealth: healthLabel(100 - healthCenter.failed * 20),
    marketplaceHealth: shopifyStatus,
    supplierHealth: cjStatus,
    paymentHealth: stripeStatus,
    governance: blockingCount > 0 ? "GATED" : "APPROVED",
    executionLayer: execution ? "PACKAGED" : "UNKNOWN",
    soulRuntime: "MONITORED",
    esis: esis.systemHealth.state,
  });

  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "realityActivation",
      title: `Reality activation: ${state}`,
      summary: `${blockingCount} blockers, confidence ${confidence}%`,
      source: "system",
      actor: "reality-activation-engine",
      payload: { state, confidence, blockingCount },
    });
  } catch {
    // best-effort
  }

  return repo.saveDecision(decision);
}

function buildDecision(
  input: EvaluateActivationInput,
  state: ActivationState,
  confidence: number,
  blockers: ActivationDecision["blockers"],
  inputs?: ActivationDecision["inputs"],
): ActivationDecision {
  const repo = getRealityActivationRepository();
  return {
    decisionId: repo.createDecisionId(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    state,
    confidence,
    blockers,
    plan: [
      "Complete commerce readiness blockers",
      "Connect Shopify, Stripe, CJ via Infrastructure",
      "Run ESIS review with validation",
      "Obtain Reality Activation READY_FOR_LIVE",
      "Enable adapter execution (future phase)",
    ],
    rollbackPlan: [
      "Set EMERGENCY_STOP via reality-activation API",
      "Disconnect marketplace OAuth tokens",
      "Pause launch orchestrator pipeline",
      "Revert to SIMULATED metrics in Mission Control",
    ],
    timeline: [
      { phase: "Staging validation", eta: "1–2 weeks" },
      { phase: "First listing (dev store)", eta: "2–3 weeks" },
      { phase: "First real sale", eta: "3–4 weeks" },
    ],
    evaluatedAt: new Date().toISOString(),
    inputs: inputs ?? {
      commerceReadiness: "UNKNOWN",
      connectorHealth: "UNKNOWN",
      marketplaceHealth: "UNKNOWN",
      supplierHealth: "UNKNOWN",
      paymentHealth: "UNKNOWN",
      governance: "GATED",
      executionLayer: "UNKNOWN",
      soulRuntime: "UNKNOWN",
      esis: "UNKNOWN",
    },
  };
}

export function setEmergencyStop(workspaceId: string, companyId: string, active: boolean): void {
  getRealityActivationRepository().setEmergencyStop(workspaceId, companyId, active);
}

export function buildRealityActivationDashboard(
  workspaceId: string,
  companyId: string,
): RealityActivationDashboard {
  const latest = getRealityActivationRepository().getLatest(workspaceId, companyId)
    ?? evaluateRealityActivation({ workspaceId, companyId });

  return {
    workspaceId,
    companyId,
    state: latest.state,
    confidence: latest.confidence,
    blockers: latest.blockers,
    recommendedAction: latest.plan[0] ?? "Evaluate activation",
    lastEvaluatedAt: latest.evaluatedAt,
  };
}
