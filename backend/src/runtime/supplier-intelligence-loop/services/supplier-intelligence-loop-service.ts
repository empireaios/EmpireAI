import { randomUUID } from "node:crypto";

import { buildSupplierDashboard } from "../../../supplier-intelligence/services/supplier-dashboard-service.js";
import { listSupplierProducts } from "../../../supplier-intelligence/services/supplier-opportunity-service.js";
import { detectSupplierRisks } from "../../../supplier-intelligence/services/supplier-risk-service.js";
import { scoreSupplierProduct } from "../../../supplier-intelligence/services/supplier-scoring-service.js";
import type { SupplierIntelligenceLoop } from "../models/supplier-intelligence-loop.js";

/** REAL-015 — Continuous supplier intelligence loop (executive recommendation only). */
export function buildSupplierIntelligenceLoop(
  workspaceId: string,
  companyId: string,
): SupplierIntelligenceLoop {
  const dashboard = buildSupplierDashboard(workspaceId, companyId);
  const products = listSupplierProducts(workspaceId);
  const signals = products.flatMap((p) => {
    const score = scoreSupplierProduct(p);
    const risks = detectSupplierRisks(p);
    const out: SupplierIntelligenceLoop["signals"] = [];

    if (score.overallScore >= 75) {
      out.push({
        signalId: randomUUID(),
        supplierProductId: p.supplierProductId,
        signalType: "BETTER_SUPPLIER",
        recommendation: `${p.title}: strong supplier score ${score.overallScore} — prioritize for launch`,
        confidence: score.overallScore,
        executiveOnly: true,
      });
    }
    if (p.costPrice && p.suggestedRetailPrice && ((p.suggestedRetailPrice - p.costPrice) / p.suggestedRetailPrice) > 0.45) {
      out.push({
        signalId: randomUUID(),
        supplierProductId: p.supplierProductId,
        signalType: "HIGHER_MARGIN_SUPPLIER",
        recommendation: `High margin candidate — ${p.title}`,
        confidence: 70,
        executiveOnly: true,
      });
    }
    if ((p.shippingDaysMax ?? 14) <= 10) {
      out.push({
        signalId: randomUUID(),
        supplierProductId: p.supplierProductId,
        signalType: "FASTER_SUPPLIER",
        recommendation: `Fast shipping (${p.shippingDaysMax}d max) — conversion advantage`,
        confidence: 65,
        executiveOnly: true,
      });
    }
    if (p.inventory !== undefined && p.inventory < 50) {
      out.push({
        signalId: randomUUID(),
        supplierProductId: p.supplierProductId,
        signalType: "INVENTORY_LOW",
        recommendation: `Low inventory (${p.inventory}) — monitor before scaling`,
        confidence: 80,
        executiveOnly: true,
      });
    }
    for (const risk of risks.slice(0, 1)) {
      out.push({
        signalId: randomUUID(),
        supplierProductId: p.supplierProductId,
        signalType: "RISK_INCREASE",
        recommendation: risk.message,
        confidence: risk.severity === "HIGH" ? 85 : 60,
        executiveOnly: true,
      });
    }
    if (p.shippingCountries.length > 0 && p.shippingCountries.length < 3) {
      out.push({
        signalId: randomUUID(),
        supplierProductId: p.supplierProductId,
        signalType: "COUNTRY_LIMITATION",
        recommendation: `Limited to ${p.shippingCountries.join(", ")} — review expansion suppliers`,
        confidence: 55,
        executiveOnly: true,
      });
    }
    return out;
  });

  return {
    moduleId: "supplier-intelligence-loop",
    missionId: "REAL-015",
    workspaceId,
    companyId,
    inventoryAlerts: signals.filter((s) => s.signalType === "INVENTORY_LOW").length,
    supplierHealthScore: dashboard.cjReadiness.overallPercent,
    signals: signals.slice(0, 25),
    computedAt: new Date().toISOString(),
  };
}
