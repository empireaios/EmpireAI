import { randomUUID } from "node:crypto";

import type { PipelineProduct } from "../models/revenue-pipeline-core.js";
import type { RevenuePipelineMission } from "../models/revenue-dashboard.js";
import { getGkrRepository } from "../repositories/sqlite-gkr-repository.js";

/** GKR-009 — Revenue pipeline missions for Executive Headquarters. */
export function generateRevenuePipelineMissions(
  workspaceId: string,
  companyId: string,
  products: PipelineProduct[],
): RevenuePipelineMission[] {
  const repo = getGkrRepository();
  const missions: RevenuePipelineMission[] = [];
  const now = new Date().toISOString();

  for (const product of products.filter((p) => p.state === "KING_APPROVAL" || p.state === "EXECUTIVE_REVIEW")) {
    const mission: RevenuePipelineMission = {
      missionId: randomUUID(),
      type: "AWAITING_KING",
      title: `King approval: ${product.title}`,
      description: `Product in ${product.state} — awaiting Grand King decision`,
      productId: product.productId,
      priority: "CRITICAL",
      confidence: product.commercialScore ?? 70,
      generatedAt: now,
    };
    repo.saveMission(mission, workspaceId, companyId);
    missions.push(mission);
  }

  for (const product of products.filter((p) => p.state === "DISCOVERED" || p.state === "UNDER_REVIEW")) {
    const mission: RevenuePipelineMission = {
      missionId: randomUUID(),
      type: "REVENUE_OPPORTUNITY",
      title: `Revenue opportunity: ${product.title}`,
      description: `First-dollar candidate in ${product.state}`,
      productId: product.productId,
      priority: "HIGH",
      confidence: product.commercialScore ?? 60,
      generatedAt: now,
    };
    repo.saveMission(mission, workspaceId, companyId);
    missions.push(mission);
  }

  for (const product of products.filter((p) => (p.health?.profitabilityHealth ?? 100) < 45 && p.state === "LIVE")) {
    const mission: RevenuePipelineMission = {
      missionId: randomUUID(),
      type: "LOSING_MONEY",
      title: `Review unprofitable product: ${product.title}`,
      description: `Profitability health ${product.health?.profitabilityHealth ?? 0}%`,
      productId: product.productId,
      priority: "HIGH",
      confidence: 80,
      generatedAt: now,
    };
    repo.saveMission(mission, workspaceId, companyId);
    missions.push(mission);
  }

  for (const product of products.filter((p) => p.state === "MONITORING" && (p.health?.overallScore ?? 0) >= 70)) {
    const mission: RevenuePipelineMission = {
      missionId: randomUUID(),
      type: "READY_TO_SCALE",
      title: `Scale candidate: ${product.title}`,
      description: `Overall health ${product.health?.overallScore ?? 0}% — ready to scale`,
      productId: product.productId,
      priority: "MEDIUM",
      confidence: product.health?.overallScore ?? 75,
      generatedAt: now,
    };
    repo.saveMission(mission, workspaceId, companyId);
    missions.push(mission);
  }

  for (const product of products.filter((p) => p.state === "PAUSED" || (p.state === "LIVE" && (p.health?.overallScore ?? 100) < 35))) {
    const mission: RevenuePipelineMission = {
      missionId: randomUUID(),
      type: "RECOMMENDED_ARCHIVE",
      title: `Archive recommendation: ${product.title}`,
      description: `Low health or paused — consider archive`,
      productId: product.productId,
      priority: "LOW",
      confidence: 65,
      generatedAt: now,
    };
    repo.saveMission(mission, workspaceId, companyId);
    missions.push(mission);
  }

  return missions;
}

export function listRevenuePipelineMissions(workspaceId: string, companyId: string): RevenuePipelineMission[] {
  return getGkrRepository().listMissions(workspaceId, companyId);
}
