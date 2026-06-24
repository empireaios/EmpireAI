import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { ProductIntelligenceRecommendation } from "./types.js";
import type {
  ProductIntelligenceSignal,
  SupplierAvailability,
  TrendDirection,
} from "../connectors/types.js";

export type ProductIntelligenceCatalogRecord = {
  id: string;
  workspaceId: string;
  productName: string;
  category: string;
  demandScore: number;
  competitionScore: number;
  marginScore: number;
  supplierAvailability: SupplierAvailability;
  trendDirection: TrendDirection;
  confidence: number;
  recommendation: ProductIntelligenceRecommendation;
  overallScore: number;
  explanation: string;
  providerCount: number;
  evaluatedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductIntelligenceSignalRecord = {
  id: string;
  catalogId: string;
  workspaceId: string;
  providerId: string;
  providerName: string;
  signal: ProductIntelligenceSignal;
  fetchedAt: string;
};

type CatalogRow = {
  id: string;
  workspace_id: string;
  product_name: string;
  category: string;
  demand_score: number;
  competition_score: number;
  margin_score: number;
  supplier_availability: string;
  trend_direction: string;
  confidence: number;
  recommendation: string;
  overall_score: number;
  explanation: string;
  provider_count: number;
  evaluated_at: string;
  created_at: string;
  updated_at: string;
};

type SignalRow = {
  id: string;
  catalog_id: string;
  workspace_id: string;
  provider_id: string;
  provider_name: string;
  signal_data: string;
  fetched_at: string;
};

function mapCatalogRow(row: CatalogRow): ProductIntelligenceCatalogRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    productName: row.product_name,
    category: row.category,
    demandScore: row.demand_score,
    competitionScore: row.competition_score,
    marginScore: row.margin_score,
    supplierAvailability: row.supplier_availability as SupplierAvailability,
    trendDirection: row.trend_direction as TrendDirection,
    confidence: row.confidence,
    recommendation: row.recommendation as ProductIntelligenceRecommendation,
    overallScore: row.overall_score,
    explanation: row.explanation,
    providerCount: row.provider_count,
    evaluatedAt: row.evaluated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProductIntelligenceCatalogRepository {
  listByWorkspace(workspaceId: string, limit = 50): ProductIntelligenceCatalogRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM product_intelligence_catalog
         WHERE workspace_id = @workspaceId
         ORDER BY overall_score DESC, evaluated_at DESC
         LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as CatalogRow[];

    return rows.map(mapCatalogRow);
  }

  getById(workspaceId: string, id: string): ProductIntelligenceCatalogRecord | undefined {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM product_intelligence_catalog
         WHERE workspace_id = @workspaceId AND id = @id`,
      )
      .get({ workspaceId, id }) as CatalogRow | undefined;

    return row ? mapCatalogRow(row) : undefined;
  }

  countByWorkspace(workspaceId: string): number {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c FROM product_intelligence_catalog WHERE workspace_id = @workspaceId`,
      )
      .get({ workspaceId }) as { c: number };
    return row.c;
  }

  upsertCatalog(record: ProductIntelligenceCatalogRecord): ProductIntelligenceCatalogRecord {
    const db = getDatabase();
    const existing = db
      .prepare(`SELECT * FROM product_intelligence_catalog WHERE id = @id`)
      .get({ id: record.id }) as CatalogRow | undefined;

    if (existing) {
      db.prepare(
        `UPDATE product_intelligence_catalog SET
          workspace_id = @workspaceId,
          product_name = @productName,
          category = @category,
          demand_score = @demandScore,
          competition_score = @competitionScore,
          margin_score = @marginScore,
          supplier_availability = @supplierAvailability,
          trend_direction = @trendDirection,
          confidence = @confidence,
          recommendation = @recommendation,
          overall_score = @overallScore,
          explanation = @explanation,
          provider_count = @providerCount,
          evaluated_at = @evaluatedAt,
          updated_at = @updatedAt
         WHERE id = @id`,
      ).run({
        id: record.id,
        workspaceId: record.workspaceId,
        productName: record.productName,
        category: record.category,
        demandScore: record.demandScore,
        competitionScore: record.competitionScore,
        marginScore: record.marginScore,
        supplierAvailability: record.supplierAvailability,
        trendDirection: record.trendDirection,
        confidence: record.confidence,
        recommendation: record.recommendation,
        overallScore: record.overallScore,
        explanation: record.explanation,
        providerCount: record.providerCount,
        evaluatedAt: record.evaluatedAt,
        updatedAt: record.updatedAt,
      });
    } else {
      db.prepare(
        `INSERT INTO product_intelligence_catalog
          (id, workspace_id, product_name, category, demand_score, competition_score,
           margin_score, supplier_availability, trend_direction, confidence, recommendation,
           overall_score, explanation, provider_count, evaluated_at, created_at, updated_at)
         VALUES
          (@id, @workspaceId, @productName, @category, @demandScore, @competitionScore,
           @marginScore, @supplierAvailability, @trendDirection, @confidence, @recommendation,
           @overallScore, @explanation, @providerCount, @evaluatedAt, @createdAt, @updatedAt)
         ON CONFLICT(id) DO UPDATE SET
          workspace_id = excluded.workspace_id,
          product_name = excluded.product_name,
          category = excluded.category,
          demand_score = excluded.demand_score,
          competition_score = excluded.competition_score,
          margin_score = excluded.margin_score,
          supplier_availability = excluded.supplier_availability,
          trend_direction = excluded.trend_direction,
          confidence = excluded.confidence,
          recommendation = excluded.recommendation,
          overall_score = excluded.overall_score,
          explanation = excluded.explanation,
          provider_count = excluded.provider_count,
          evaluated_at = excluded.evaluated_at,
          updated_at = excluded.updated_at`,
      ).run({
        id: record.id,
        workspaceId: record.workspaceId,
        productName: record.productName,
        category: record.category,
        demandScore: record.demandScore,
        competitionScore: record.competitionScore,
        marginScore: record.marginScore,
        supplierAvailability: record.supplierAvailability,
        trendDirection: record.trendDirection,
        confidence: record.confidence,
        recommendation: record.recommendation,
        overallScore: record.overallScore,
        explanation: record.explanation,
        providerCount: record.providerCount,
        evaluatedAt: record.evaluatedAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
    }

    return record;
  }

  replaceSignals(
    catalogId: string,
    workspaceId: string,
    signals: ProductIntelligenceSignal[],
  ): ProductIntelligenceSignalRecord[] {
    const db = getDatabase();
    db.prepare(
      `DELETE FROM product_intelligence_signals WHERE catalog_id = @catalogId AND workspace_id = @workspaceId`,
    ).run({ catalogId, workspaceId });

    const insert = db.prepare(
      `INSERT INTO product_intelligence_signals
        (id, catalog_id, workspace_id, provider_id, provider_name, signal_data, fetched_at)
       VALUES (@id, @catalogId, @workspaceId, @providerId, @providerName, @signalData, @fetchedAt)`,
    );

    const records: ProductIntelligenceSignalRecord[] = [];
    for (const signal of signals) {
      const record: ProductIntelligenceSignalRecord = {
        id: randomUUID(),
        catalogId,
        workspaceId,
        providerId: signal.providerId,
        providerName: signal.providerName,
        signal,
        fetchedAt: signal.fetchedAt,
      };
      insert.run({
        id: record.id,
        catalogId,
        workspaceId,
        providerId: signal.providerId,
        providerName: signal.providerName,
        signalData: JSON.stringify(signal),
        fetchedAt: signal.fetchedAt,
      });
      records.push(record);
    }

    return records;
  }

  listSignals(catalogId: string, workspaceId: string): ProductIntelligenceSignalRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM product_intelligence_signals
         WHERE catalog_id = @catalogId AND workspace_id = @workspaceId
         ORDER BY provider_name ASC`,
      )
      .all({ catalogId, workspaceId }) as SignalRow[];

    return rows.map((row) => ({
      id: row.id,
      catalogId: row.catalog_id,
      workspaceId: row.workspace_id,
      providerId: row.provider_id,
      providerName: row.provider_name,
      signal: JSON.parse(row.signal_data) as ProductIntelligenceSignal,
      fetchedAt: row.fetched_at,
    }));
  }

  statsForWorkspace(workspaceId: string): {
    productCount: number;
    avgConfidence: number;
    activeSignals: number;
  } {
    const db = getDatabase();
    const catalogStats = db
      .prepare(
        `SELECT COUNT(*) AS product_count, AVG(confidence) AS avg_confidence
         FROM product_intelligence_catalog WHERE workspace_id = @workspaceId`,
      )
      .get({ workspaceId }) as { product_count: number; avg_confidence: number | null };

    const signalCount = db
      .prepare(
        `SELECT COUNT(*) AS c FROM product_intelligence_signals WHERE workspace_id = @workspaceId`,
      )
      .get({ workspaceId }) as { c: number };

    return {
      productCount: catalogStats.product_count,
      avgConfidence: catalogStats.avg_confidence ?? 0,
      activeSignals: signalCount.c,
    };
  }
}

export const productIntelligenceCatalogRepository = new ProductIntelligenceCatalogRepository();
