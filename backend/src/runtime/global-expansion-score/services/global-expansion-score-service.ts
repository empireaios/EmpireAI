import { listExpansionIntelligenceScores } from "../../global-commerce-intelligence/services/expansion-intelligence-score-service.js";
import { buildGlobalExpansionCommand } from "../../global-expansion-command/services/global-expansion-command-service.js";
import type { GlobalExpansionScore } from "../models/global-expansion-score.js";

type ScoreItem = GlobalExpansionScore["items"][number];

function expansionWhy(name: string, roiUsd: number, rank: number): string {
  return rank <= 3
    ? `${name} ranked #${rank} by ROI — prioritize for SUCCESS-001 expansion after US proof ($${roiUsd} profit impact)`
    : `${name} ranked #${rank} — defer until top SUCCESS-001 markets proven ($${roiUsd} profit potential)`;
}

function makeItem(
  itemId: string,
  label: string,
  score: number,
  rank: number,
  status: ScoreItem["status"],
  recommendation: string,
  evidence: string,
  profitUsd: number,
): ScoreItem {
  return {
    itemId,
    label: `#${rank} · ${label}`,
    score,
    status,
    recommendation,
    evidence,
    why: expansionWhy(label, profitUsd, rank),
  };
}

/** REAL-089 — Global expansion score (expansion command + GCI scores). */
export function buildGlobalExpansionScore(
  workspaceId: string,
  companyId: string,
): GlobalExpansionScore {
  const expansion = buildGlobalExpansionCommand(workspaceId, companyId);
  let gciScores: ReturnType<typeof listExpansionIntelligenceScores> = [];
  try {
    gciScores = listExpansionIntelligenceScores(workspaceId, companyId);
  } catch { /* optional */ }

  const ranked = [...expansion.expansionTargets]
    .map((t) => ({
      ...t,
      roiScore: Math.round((t.profitImpactUsd / Math.max(t.revenueImpactUsd, 1)) * 100 + t.readinessScore * 0.5),
    }))
    .sort((a, b) => b.roiScore - a.roiScore);

  const items: ScoreItem[] = ranked.map((target, index) => {
    const rank = index + 1;
    const gci = gciScores.find((s) =>
      target.targetType === "country" && s.displayName === target.name,
    );
    const status: ScoreItem["status"] = target.priority === "CRITICAL" || target.readinessScore >= 75
      ? "READY"
      : target.readinessScore >= 50 ? "PENDING" : "BLOCKED";

    return makeItem(
      target.targetId,
      `${target.targetType} · ${target.name}`,
      target.roiScore,
      rank,
      status,
      rank <= 3
        ? `Execute ${target.name} expansion — ${expansion.executiveRecommendation.slice(0, 80)}`
        : `Monitor ${target.name} — expand after top-3 SUCCESS-001 markets proven`,
      gci
        ? `GCI score ${gci.expansionScore} grade ${gci.grade} · readiness ${target.readinessScore} · profit $${target.profitImpactUsd}`
        : `Readiness ${target.readinessScore} · revenue $${target.revenueImpactUsd} · profit $${target.profitImpactUsd} · ${target.evidence}`,
      target.profitImpactUsd,
    );
  });

  const byType = {
    country: items.filter((i) => i.label.includes("country")).length,
    marketplace: items.filter((i) => i.label.includes("marketplace")).length,
    category: items.filter((i) => i.label.includes("category")).length,
    supplier: items.filter((i) => i.label.includes("supplier")).length,
  };

  const topTarget = ranked[0]?.name ?? "United States";
  const summary = `REAL-089 · Global expansion score · ${items.length} targets ranked · top ROI: ${topTarget} · countries:${byType.country} marketplaces:${byType.marketplace} categories:${byType.category} suppliers:${byType.supplier}`;

  return {
    moduleId: "global-expansion-score",
    missionId: "REAL-089",
    workspaceId,
    companyId,
    summary,
    items,
    reusedModules: ["global-expansion-command", "global-commerce-intelligence", "global-category-expansion-engine"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
