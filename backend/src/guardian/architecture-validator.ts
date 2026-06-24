import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import { CONNECTOR_CATALOG } from "../connectors/catalog.js";
import { listConnectorMetadata } from "../connectors/metadata.js";
import { costIntelligenceRegistry } from "../cost/cost-registry.js";
import { financialLedger } from "../finance/ledger.js";
import { royaltyFramework } from "../finance/royalty-framework.js";
import { supplierIntelligenceFramework } from "../intelligence/supplier-intelligence.js";
import { evaluateSupplier } from "../intelligence/supplier-intelligence-engine/index.js";
import { intelligenceModuleRegistry } from "../brain/contract/registry.js";
import { workforceRegistry } from "../workforce/registry.js";
import { workforceIntelligenceQuery } from "../workforce/intelligence-query.js";
import { retentionFramework } from "../retention/retention-framework.js";
import { paymentFramework } from "../payments/payment-framework.js";
import { treasuryEngine } from "../treasury/treasury-engine.js";
import { withdrawalRulesFramework } from "../treasury/withdrawal-rules.js";
import { productIntelligenceEngine } from "../intelligence/pie-engine.js";
import { evaluateProduct } from "../intelligence/product-intelligence-engine/index.js";
import { buildMockEvaluationInput } from "../intelligence/product-intelligence-engine/mock-samples.js";
import { productScoutEngine } from "../intelligence/product-scout/index.js";
import {
  INTELLIGENCE_MODULE_CATALOG,
  INTELLIGENCE_MODULE_IDS,
  MODULE_CAPABILITIES,
} from "../brain/contract/index.js";
import type { HealthStatus } from "./types.js";

export type ArchitectureCheck = {
  id: string;
  status: HealthStatus;
  message: string;
  metadata?: Record<string, unknown>;
};

export type ArchitectureValidationReport = {
  overall: HealthStatus;
  checkedAt: string;
  checks: ArchitectureCheck[];
  summary: string;
};

/** Guardian architecture validation — framework self-check, not full enforcement yet. */
export class ArchitectureValidator {
  validate(workspaceId = "system"): ArchitectureValidationReport {
    const checks: ArchitectureCheck[] = [];

    checks.push(this.checkRequiredTables());
    checks.push(this.checkConnectorCatalog());
    checks.push(this.checkConnectorMetadata());
    checks.push(this.checkWorkforcePrepared());
    checks.push(this.checkWorkforceIntelligenceQuery());
    checks.push(this.checkLedgerFramework(workspaceId));
    checks.push(this.checkTreasuryDerivation(workspaceId));
    checks.push(this.checkWithdrawalRules(workspaceId));
    checks.push(this.checkRoyaltyFramework(workspaceId));
    checks.push(this.checkPieExplainability());
    checks.push(this.checkProductIntelligenceEngine());
    checks.push(this.checkProductScoutEngine());
    checks.push(this.checkSupplierIntelligence());
    checks.push(this.checkSupplierIntelligenceEngine());
    checks.push(this.checkRetentionDoctrine());
    checks.push(this.checkCostRegistry());
    checks.push(this.checkPaymentFramework(workspaceId));
    checks.push(this.checkBrainContract());

    const failed = checks.filter((c) => c.status === "failed").length;
    const degraded = checks.filter((c) => c.status === "degraded").length;
    const overall: HealthStatus =
      failed > 0 ? "failed" : degraded > 0 ? "degraded" : "healthy";

    const report: ArchitectureValidationReport = {
      overall,
      checkedAt: new Date().toISOString(),
      checks,
      summary: `Architecture validation: ${checks.length} checks; failed=${failed}; degraded=${degraded}`,
    };

    this.persist(report);
    return report;
  }

  private persist(report: ArchitectureValidationReport): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO guardian_architecture_checks (id, overall, report, created_at)
       VALUES (@id, @overall, @report, @createdAt)`,
    ).run({
      id: randomUUID(),
      overall: report.overall,
      report: JSON.stringify(report),
      createdAt: report.checkedAt,
    });
  }

  private checkRequiredTables(): ArchitectureCheck {
    const db = getDatabase();
    const required = [
      "financial_ledger_events",
      "connector_connections",
      "pie_product_scores",
      "product_intelligence_evaluations",
      "product_scout_evaluations",
      "supplier_intelligence_scores",
      "supplier_intelligence_evaluations",
      "retention_states",
      "cost_dependencies",
    ];
    const existing = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
      .all() as Array<{ name: string }>;
    const names = new Set(existing.map((r) => r.name));
    const missing = required.filter((t) => !names.has(t));
    return {
      id: "phase3-tables",
      status: missing.length === 0 ? "healthy" : "failed",
      message:
        missing.length === 0
          ? "Phase 3 foundation tables present"
          : `Missing Phase 3 tables: ${missing.join(", ")}`,
    };
  }

  private checkConnectorMetadata(): ArchitectureCheck {
    const metadata = listConnectorMetadata();
    const withCost = metadata.filter((m) => m.costType && m.riskLevel).length;
    return {
      id: "connector-metadata",
      status: withCost >= CONNECTOR_CATALOG.length ? "healthy" : "degraded",
      message: `${metadata.length} connectors with cost/risk metadata registry`,
      metadata: { apiKeyRequired: metadata.filter((m) => m.apiKeyRequired).length },
    };
  }

  private checkWorkforceIntelligenceQuery(): ArchitectureCheck {
    const roles = workforceRegistry.list();
    const withCaps = roles.filter(
      (r) => workforceIntelligenceQuery.getCapabilities(r.id).length > 0,
    ).length;
    return {
      id: "workforce-intelligence-query",
      status: withCaps >= 9 ? "healthy" : "degraded",
      message: `${withCaps}/${roles.length} workforce roles can query intelligence modules`,
    };
  }

  private checkWithdrawalRules(workspaceId: string): ArchitectureCheck {
    const validation = withdrawalRulesFramework.validate(workspaceId, 0);
    return {
      id: "withdrawal-rules",
      status: validation.violations.some((v) => v.ruleId === "positive-amount") ? "healthy" : "degraded",
      message: "Withdrawal rules framework validates cash bucket constraints",
      metadata: { rules: withdrawalRulesFramework.listRules().length },
    };
  }

  private checkRoyaltyFramework(workspaceId: string): ArchitectureCheck {
    const calc = royaltyFramework.calculate(workspaceId);
    return {
      id: "royalty-framework",
      status: calc.royaltyRate === 0.1 ? "healthy" : "failed",
      message: "10% net profit royalty framework operational",
      metadata: { royaltyCents: calc.royaltyCents },
    };
  }

  private checkSupplierIntelligence(): ArchitectureCheck {
    const catalog = supplierIntelligenceFramework.listCatalog();
    const score = supplierIntelligenceFramework.score({
      workspaceId: "system",
      supplierId: catalog[0]?.id ?? "sup-cj-001",
    });
    return {
      id: "supplier-intelligence",
      status: score.why.length >= 1 && catalog.length >= 3 ? "healthy" : "degraded",
      message: "Legacy supplier intelligence framework with mock catalog and scoring",
      metadata: { suppliers: catalog.length, recommendation: score.recommendation },
    };
  }

  private checkSupplierIntelligenceEngine(): ArchitectureCheck {
    const trusted = evaluateSupplier({ supplierId: "sup-spocket-001", workspaceId: "system" });
    const fake = evaluateSupplier({ supplierId: "sup-fake-001", workspaceId: "system" });
    const registered = intelligenceModuleRegistry.has("supplier-intelligence");

    return {
      id: "supplier-intelligence-engine",
      status:
        trusted.explanation.length >= 10 &&
        trusted.trustScore > 0 &&
        fake.overallRecommendation === "REJECT" &&
        fake.fakeSupplierRisk >= 65 &&
        registered
          ? "healthy"
          : "degraded",
      message:
        "Supplier Intelligence Engine returns trust scores with fake detection and Brain Contract registration",
      metadata: {
        trustedRecommendation: trusted.overallRecommendation,
        fakeRecommendation: fake.overallRecommendation,
        fakeSupplierRisk: fake.fakeSupplierRisk,
        contractRegistered: registered,
      },
    };
  }

  private checkConnectorCatalog(): ArchitectureCheck {
    return {
      id: "connector-catalog",
      status: CONNECTOR_CATALOG.length >= 15 ? "healthy" : "degraded",
      message: `${CONNECTOR_CATALOG.length} connectors catalogued with common interface`,
      metadata: { categories: [...new Set(CONNECTOR_CATALOG.map((c) => c.category))] },
    };
  }

  private checkWorkforcePrepared(): ArchitectureCheck {
    const roles = workforceRegistry.list();
    const prepared = roles.filter((r) => r.status !== "planned").length;
    return {
      id: "workforce-registry",
      status: prepared >= 8 ? "healthy" : "degraded",
      message: `${prepared}/${roles.length} AI workforce roles active or prepared`,
    };
  }

  private checkLedgerFramework(workspaceId: string): ArchitectureCheck {
    try {
      financialLedger.summarize(workspaceId);
      return {
        id: "financial-ledger",
        status: "healthy",
        message: "Append-only ledger framework operational",
      };
    } catch (error) {
      return {
        id: "financial-ledger",
        status: "failed",
        message: error instanceof Error ? error.message : "Ledger check failed",
      };
    }
  }

  private checkTreasuryDerivation(workspaceId: string): ArchitectureCheck {
    treasuryEngine.compute(workspaceId);
    return {
      id: "treasury-engine",
      status: "healthy",
      message: "Treasury buckets derived dynamically from ledger",
    };
  }

  private checkPieExplainability(): ArchitectureCheck {
    const score = productIntelligenceEngine.score({
      workspaceId: "system",
      productName: "Guardian Probe SKU",
      signals: { demand: { score: 80, evidence: ["probe"] } },
    });
    return {
      id: "pie-engine",
      status: score.why.length >= 1 ? "healthy" : "degraded",
      message: "PIE returns explainable recommendations",
      metadata: { recommendation: score.recommendation, confidence: score.confidence },
    };
  }

  private checkProductIntelligenceEngine(): ArchitectureCheck {
    const sellCandidate = evaluateProduct(buildMockEvaluationInput(0));
    const rejectCandidate = evaluateProduct(buildMockEvaluationInput(1));
    return {
      id: "product-intelligence-engine",
      status:
        sellCandidate.explanation.length >= 1 &&
        sellCandidate.overallScore >= 0 &&
        ["SELL", "DO_NOT_SELL", "REVIEW"].includes(sellCandidate.recommendation) &&
        rejectCandidate.recommendation === "DO_NOT_SELL"
          ? "healthy"
          : "degraded",
      message: "Product Intelligence Engine returns independent scores with SELL/DO_NOT_SELL/REVIEW recommendations",
      metadata: {
        sellRecommendation: sellCandidate.recommendation,
        rejectRecommendation: rejectCandidate.recommendation,
        overallScore: sellCandidate.overallScore,
      },
    };
  }

  private checkProductScoutEngine(): ArchitectureCheck {
    const evaluation = productScoutEngine.evaluateMock("system", "prod-pet-hair-remover");
    const rejected = productScoutEngine.evaluateMock("system", "prod-mystery-gadget");
    return {
      id: "product-scout-engine",
      status:
        evaluation.why.length >= 1 &&
        evaluation.finalEmpireScore >= 0 &&
        rejected.recommendation === "REJECT"
          ? "healthy"
          : "degraded",
      message: "AI Product Scout returns Empire scores with Guardian APPROVE/REVIEW/REJECT verdicts",
      metadata: {
        topRecommendation: evaluation.recommendation,
        rejectedGuardian: rejected.guardianVerdict.flags,
      },
    };
  }

  private checkRetentionDoctrine(): ArchitectureCheck {
    retentionFramework.ensureActive("system");
    return {
      id: "retention-framework",
      status: "healthy",
      message: "Retention framework preserves businesses on cancellation",
    };
  }

  private checkCostRegistry(): ArchitectureCheck {
    const catalog = costIntelligenceRegistry.listCatalog();
    return {
      id: "cost-intelligence",
      status: catalog.length >= 5 ? "healthy" : "degraded",
      message: `${catalog.length} dependencies tracked with cost/risk metadata`,
    };
  }

  private checkPaymentFramework(workspaceId: string): ArchitectureCheck {
    paymentFramework.ensureWallet(workspaceId, "empireai");
    paymentFramework.ensureWallet(workspaceId, "advertising");
    return {
      id: "payment-framework",
      status: "healthy",
      message: "Payment methods and wallet framework prepared",
    };
  }

  private checkBrainContract(): ArchitectureCheck {
    const catalogIds = new Set(INTELLIGENCE_MODULE_CATALOG.map((entry) => entry.moduleId));
    const missingFromCatalog = INTELLIGENCE_MODULE_IDS.filter((id) => !catalogIds.has(id));
    const modulesWithCapabilities = INTELLIGENCE_MODULE_IDS.filter(
      (id) => (MODULE_CAPABILITIES[id]?.length ?? 0) > 0,
    ).length;

    const healthy =
      missingFromCatalog.length === 0 &&
      INTELLIGENCE_MODULE_CATALOG.length === INTELLIGENCE_MODULE_IDS.length &&
      modulesWithCapabilities === INTELLIGENCE_MODULE_IDS.length;

    return {
      id: "brain-contract",
      status: healthy ? "healthy" : "failed",
      message: healthy
        ? `Brain Contract defines ${INTELLIGENCE_MODULE_IDS.length} intelligence modules with capability maps`
        : `Brain Contract incomplete: missing catalog=${missingFromCatalog.join(", ") || "none"}`,
      metadata: {
        moduleIds: [...INTELLIGENCE_MODULE_IDS],
        catalogEntries: INTELLIGENCE_MODULE_CATALOG.length,
        modulesWithCapabilities,
      },
    };
  }
}

export const architectureValidator = new ArchitectureValidator();
