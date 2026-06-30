import type { AmazonListingPackage } from "../models/amazon-listing-package.js";
import { getDatabase } from "../../../brain/database.js";

function mapJson<T>(row: Record<string, unknown>): T {
  return JSON.parse(String(row["record_json"])) as T;
}

export class AmazonListingRepository {
  saveListing(listing: AmazonListingPackage): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO amazon_listing_packages
        (listing_id, workspace_id, company_id, sku, record_json, created_at, updated_at)
       VALUES (@listingId, @workspaceId, @companyId, @sku, @recordJson, @createdAt, @updatedAt)
       ON CONFLICT(listing_id) DO UPDATE SET record_json = excluded.record_json, updated_at = excluded.updated_at`,
    ).run({
      listingId: listing.listingId,
      workspaceId: listing.workspaceId,
      companyId: listing.companyId,
      sku: listing.sku,
      recordJson: JSON.stringify(listing),
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    });
  }

  getListing(workspaceId: string, companyId: string, listingId: string): AmazonListingPackage | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT record_json FROM amazon_listing_packages
         WHERE workspace_id = @workspaceId AND company_id = @companyId AND listing_id = @listingId`,
      )
      .get({ workspaceId, companyId, listingId }) as Record<string, unknown> | undefined;
    return row ? mapJson<AmazonListingPackage>(row) : null;
  }

  listListings(workspaceId: string, companyId: string): AmazonListingPackage[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT record_json FROM amazon_listing_packages
         WHERE workspace_id = @workspaceId AND company_id = @companyId
         ORDER BY updated_at DESC`,
      )
      .all({ workspaceId, companyId }) as Record<string, unknown>[];
    return rows.map((row) => mapJson<AmazonListingPackage>(row));
  }
}

let repository: AmazonListingRepository | null = null;

export function getAmazonListingRepository(): AmazonListingRepository {
  repository ??= new AmazonListingRepository();
  return repository;
}

export function resetAmazonListingRepository(): void {
  repository = null;
}
