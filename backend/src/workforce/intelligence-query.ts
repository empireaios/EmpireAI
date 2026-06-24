import { productIntelligenceEngine } from "../intelligence/pie-engine.js";
import { buildSamplePieInput } from "../intelligence/pie-samples.js";
import {
  listScoutCatalog,
  productScoutEngine,
} from "../intelligence/product-scout/index.js";
import { supplierIntelligenceFramework } from "../intelligence/supplier-intelligence.js";
import {
  compareSuppliers,
  discoverSuppliers,
  evaluateSupplier,
  listMockCatalog,
} from "../intelligence/supplier-intelligence-engine/index.js";
import { defaultConnectorRegistry } from "../connectors/registry.js";
import { listConnectorMetadata } from "../connectors/metadata.js";
import { financialLedger } from "../finance/ledger.js";
import { treasuryEngine } from "../treasury/treasury-engine.js";
import { royaltyFramework } from "../finance/royalty-framework.js";
import { costIntelligenceRegistry } from "../cost/cost-registry.js";
import { workforceRegistry } from "./registry.js";
import type { WorkforceRoleId } from "./types.js";

export type IntelligenceQueryType =
  | "pie.score"
  | "pie.samples"
  | "scout.evaluate"
  | "scout.scan"
  | "scout.catalog"
  | "supplier.list"
  | "supplier.score"
  | "supplier.discover"
  | "supplier.evaluate"
  | "supplier.compare"
  | "connector.list"
  | "connector.metadata"
  | "finance.summary"
  | "treasury.snapshot"
  | "royalty.calculate"
  | "cost.catalog";

export type IntelligenceQueryRequest = {
  roleId: WorkforceRoleId;
  queryType: IntelligenceQueryType;
  workspaceId: string;
  payload?: Record<string, unknown>;
};

export type IntelligenceQueryResult = {
  queryType: IntelligenceQueryType;
  roleId: WorkforceRoleId;
  allowed: boolean;
  data?: unknown;
  error?: string;
  queriedAt: string;
};

const ROLE_CAPABILITIES: Record<WorkforceRoleId, IntelligenceQueryType[]> = {
  "ai-ceo": [
    "pie.score",
    "pie.samples",
    "scout.evaluate",
    "scout.scan",
    "scout.catalog",
    "supplier.list",
    "supplier.score",
    "supplier.discover",
    "supplier.evaluate",
    "supplier.compare",
    "connector.list",
    "connector.metadata",
    "finance.summary",
    "treasury.snapshot",
    "royalty.calculate",
    "cost.catalog",
  ],
  "ai-cfo": ["finance.summary", "treasury.snapshot", "royalty.calculate", "cost.catalog"],
  "ai-product-intelligence": [
    "pie.score",
    "pie.samples",
    "scout.evaluate",
    "scout.scan",
    "scout.catalog",
    "supplier.list",
    "supplier.score",
    "supplier.discover",
    "supplier.evaluate",
    "supplier.compare",
    "connector.metadata",
  ],
  "ai-product-scout": [
    "scout.evaluate",
    "scout.scan",
    "scout.catalog",
    "pie.score",
    "pie.samples",
    "supplier.score",
  ],
  "ai-marketing-director": [
    "pie.score",
    "pie.samples",
    "scout.evaluate",
    "scout.catalog",
    "connector.list",
    "connector.metadata",
    "cost.catalog",
  ],
  "ai-operations": ["supplier.list", "supplier.score", "connector.list"],
  "ai-supplier-manager": [
    "supplier.list",
    "supplier.score",
    "supplier.discover",
    "supplier.evaluate",
    "supplier.compare",
    "connector.list",
    "connector.metadata",
  ],
  "ai-supplier-intelligence": [
    "supplier.list",
    "supplier.discover",
    "supplier.evaluate",
    "supplier.compare",
    "supplier.score",
    "connector.metadata",
  ],
  "ai-customer-success": ["finance.summary"],
  "ai-treasurer": ["finance.summary", "treasury.snapshot", "royalty.calculate"],
  "ai-guardian": [
    "connector.metadata",
    "finance.summary",
    "treasury.snapshot",
    "cost.catalog",
  ],
};

/** AI Workforce Interface — agents query intelligence modules through role-scoped capabilities. */
export class WorkforceIntelligenceQuery {
  getCapabilities(roleId: WorkforceRoleId): IntelligenceQueryType[] {
    return ROLE_CAPABILITIES[roleId] ?? [];
  }

  query(request: IntelligenceQueryRequest): IntelligenceQueryResult {
    const capabilities = this.getCapabilities(request.roleId);
    const queriedAt = new Date().toISOString();

    if (!capabilities.includes(request.queryType)) {
      return {
        queryType: request.queryType,
        roleId: request.roleId,
        allowed: false,
        error: `Role ${request.roleId} lacks capability: ${request.queryType}`,
        queriedAt,
      };
    }

    try {
      const data = this.executeQuery(request);
      return {
        queryType: request.queryType,
        roleId: request.roleId,
        allowed: true,
        data,
        queriedAt,
      };
    } catch (error) {
      return {
        queryType: request.queryType,
        roleId: request.roleId,
        allowed: true,
        error: error instanceof Error ? error.message : "Query failed",
        queriedAt,
      };
    }
  }

  private executeQuery(request: IntelligenceQueryRequest): unknown {
    const { queryType, workspaceId, payload = {} } = request;

    switch (queryType) {
      case "pie.score":
        return productIntelligenceEngine.score({
          workspaceId,
          productId: payload.productId as string | undefined,
          productName: (payload.productName as string) ?? "Unnamed Product",
          signals: payload.signals as Parameters<typeof productIntelligenceEngine.score>[0]["signals"],
        });
      case "pie.samples": {
        const idx = typeof payload.sampleIndex === "number" ? payload.sampleIndex : 0;
        return productIntelligenceEngine.score(buildSamplePieInput(workspaceId, idx));
      }
      case "scout.evaluate":
        return productScoutEngine.evaluateMock(
          workspaceId,
          (payload.productId as string | undefined) ??
            (typeof payload.sampleIndex === "number" ? payload.sampleIndex : 0),
        );
      case "scout.scan":
        return productScoutEngine.scanPortfolio(
          workspaceId,
          typeof payload.limit === "number" ? payload.limit : undefined,
        );
      case "scout.catalog":
        return listScoutCatalog();
      case "supplier.list":
        return listMockCatalog();
      case "supplier.score":
        return supplierIntelligenceFramework.score({
          workspaceId,
          supplierId: String(payload.supplierId ?? "sup-cj-001"),
        });
      case "supplier.discover":
        return discoverSuppliers(workspaceId, {
          region: payload.region as string | undefined,
          maxShipDays: payload.maxShipDays as number | undefined,
          minReliability: payload.minReliability as number | undefined,
        });
      case "supplier.evaluate":
        return evaluateSupplier({
          workspaceId,
          supplierId: String(payload.supplierId ?? "sup-cj-001"),
          sellingPriceCents: payload.sellingPriceCents as number | undefined,
        });
      case "supplier.compare":
        return compareSuppliers(
          workspaceId,
          (payload.supplierIds as string[]) ?? ["sup-cj-001", "sup-spocket-001"],
        );
      case "connector.list":
        return defaultConnectorRegistry.listDefinitions();
      case "connector.metadata":
        return listConnectorMetadata();
      case "finance.summary":
        return financialLedger.generateReport(workspaceId);
      case "treasury.snapshot":
        return treasuryEngine.compute(workspaceId);
      case "royalty.calculate":
        return royaltyFramework.calculate(workspaceId);
      case "cost.catalog":
        return costIntelligenceRegistry.listCatalog();
      default:
        throw new Error(`Unhandled query type: ${queryType}`);
    }
  }

  orgChartWithCapabilities() {
    return workforceRegistry.list().map((role) => ({
      ...role,
      intelligenceCapabilities: this.getCapabilities(role.id),
    }));
  }
}

export const workforceIntelligenceQuery = new WorkforceIntelligenceQuery();
