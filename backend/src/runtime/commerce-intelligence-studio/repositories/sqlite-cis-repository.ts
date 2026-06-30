import type { CommercialReviewResult } from "../models/commercial-review.js";
import type { SupplierProductInput } from "../models/commercial-review.js";
import type { WinningListingPackage } from "../models/winning-listing.js";
import type { CommercialStrategyRecommendation } from "../models/commercial-strategy.js";
import type { CommercialExperimentResult } from "../models/commercial-experiment.js";
import { getDatabase } from "../../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class CisRepository {
  saveSupplierProduct(workspaceId: string, companyId: string, product: SupplierProductInput): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO cis_supplier_products (supplier_product_id, workspace_id, company_id, record_json, updated_at)
       VALUES (@id, @workspaceId, @companyId, @json, @updatedAt)
       ON CONFLICT(supplier_product_id, workspace_id, company_id) DO UPDATE SET record_json = excluded.record_json, updated_at = excluded.updated_at`,
    ).run({
      id: product.supplierProductId,
      workspaceId,
      companyId,
      json: JSON.stringify(product),
      updatedAt: new Date().toISOString(),
    });
  }

  listSupplierProducts(workspaceId: string, companyId: string): SupplierProductInput[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT record_json FROM cis_supplier_products WHERE workspace_id = @workspaceId AND company_id = @companyId`)
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<SupplierProductInput>(r));
  }

  saveReview(review: CommercialReviewResult): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO cis_commercial_reviews (review_id, workspace_id, company_id, supplier_product_id, record_json, reviewed_at)
       VALUES (@reviewId, @workspaceId, @companyId, @supplierProductId, @json, @reviewedAt)`,
    ).run({
      reviewId: review.reviewId,
      workspaceId: review.workspaceId,
      companyId: review.companyId,
      supplierProductId: review.supplierProductId,
      json: JSON.stringify(review),
      reviewedAt: review.reviewedAt,
    });
  }

  getLatestReview(workspaceId: string, companyId: string, supplierProductId: string): CommercialReviewResult | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM cis_commercial_reviews
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND supplier_product_id = @supplierProductId
         ORDER BY reviewed_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId, supplierProductId }) as Record<string, unknown> | undefined;
    return row ? mapJson<CommercialReviewResult>(row) : null;
  }

  listReviews(workspaceId: string, companyId: string): CommercialReviewResult[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM cis_commercial_reviews
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY reviewed_at DESC`,
      )
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    const seen = new Set<string>();
    const results: CommercialReviewResult[] = [];
    for (const row of rows) {
      const r = mapJson<CommercialReviewResult>(row);
      if (!seen.has(r.supplierProductId)) {
        seen.add(r.supplierProductId);
        results.push(r);
      }
    }
    return results;
  }

  saveWinningListing(listing: WinningListingPackage): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO cis_winning_listings (listing_id, workspace_id, company_id, supplier_product_id, record_json, generated_at)
       VALUES (@listingId, @workspaceId, @companyId, @supplierProductId, @json, @generatedAt)
       ON CONFLICT(listing_id) DO UPDATE SET record_json = excluded.record_json`,
    ).run({
      listingId: listing.listingId,
      workspaceId: listing.workspaceId,
      companyId: listing.companyId,
      supplierProductId: listing.supplierProductId,
      json: JSON.stringify(listing),
      generatedAt: listing.generatedAt,
    });
  }

  getWinningListing(workspaceId: string, companyId: string, listingId: string): WinningListingPackage | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM cis_winning_listings
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND listing_id = @listingId`,
      )
      .get({ workspaceId, companyId, listingId }) as Record<string, unknown> | undefined;
    return row ? mapJson<WinningListingPackage>(row) : null;
  }

  listWinningListings(workspaceId: string, companyId: string): WinningListingPackage[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM cis_winning_listings
         WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY generated_at DESC`,
      )
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    return rows.map((r) => mapJson<WinningListingPackage>(r));
  }

  saveStrategy(strategy: CommercialStrategyRecommendation): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO cis_commercial_strategies (strategy_id, workspace_id, company_id, supplier_product_id, record_json, computed_at)
       VALUES (@strategyId, @workspaceId, @companyId, @supplierProductId, @json, @computedAt)`,
    ).run({
      strategyId: strategy.strategyId,
      workspaceId: strategy.workspaceId,
      companyId: strategy.companyId,
      supplierProductId: strategy.supplierProductId,
      json: JSON.stringify(strategy),
      computedAt: strategy.computedAt,
    });
  }

  getLatestStrategy(workspaceId: string, companyId: string, supplierProductId: string): CommercialStrategyRecommendation | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM cis_commercial_strategies
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND supplier_product_id = @supplierProductId
         ORDER BY computed_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId, supplierProductId }) as Record<string, unknown> | undefined;
    return row ? mapJson<CommercialStrategyRecommendation>(row) : null;
  }

  saveExperiment(experiment: CommercialExperimentResult): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO cis_commercial_experiments (experiment_id, workspace_id, company_id, supplier_product_id, record_json, classified_at)
       VALUES (@experimentId, @workspaceId, @companyId, @supplierProductId, @json, @classifiedAt)`,
    ).run({
      experimentId: experiment.experimentId,
      workspaceId: experiment.workspaceId,
      companyId: experiment.companyId,
      supplierProductId: experiment.supplierProductId,
      json: JSON.stringify(experiment),
      classifiedAt: experiment.classifiedAt,
    });
  }

  getLatestExperiment(workspaceId: string, companyId: string, supplierProductId: string): CommercialExperimentResult | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM cis_commercial_experiments
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND supplier_product_id = @supplierProductId
         ORDER BY classified_at DESC LIMIT 1`,
      )
      .get({ workspaceId, companyId, supplierProductId }) as Record<string, unknown> | undefined;
    return row ? mapJson<CommercialExperimentResult>(row) : null;
  }

  listExperiments(workspaceId: string, companyId: string): CommercialExperimentResult[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM cis_commercial_experiments
         WHERE workspace_id = @workspaceId AND company_id = @companyId ORDER BY classified_at DESC`,
      )
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    const seen = new Set<string>();
    const results: CommercialExperimentResult[] = [];
    for (const row of rows) {
      const e = mapJson<CommercialExperimentResult>(row);
      if (!seen.has(e.supplierProductId)) {
        seen.add(e.supplierProductId);
        results.push(e);
      }
    }
    return results;
  }
}

let repository: CisRepository | null = null;

export function getCisRepository(): CisRepository {
  repository ??= new CisRepository();
  return repository;
}

export function resetCisRepository(): void {
  repository = null;
}
