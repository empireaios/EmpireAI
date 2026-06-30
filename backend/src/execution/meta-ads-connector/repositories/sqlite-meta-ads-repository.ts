import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  MetaAdsCampaignRecord,
  MetaAdsOAuthRecord,
} from "../models/meta-ads-campaign-record.js";
import type { MetaAdsRepository } from "./meta-ads-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapOAuthRow(row: Record<string, unknown>): MetaAdsOAuthRecord {
  return {
    oauthId: String(row.oauth_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    accessToken: String(row.access_token),
    tokenType: String(row.token_type),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    adAccountId: row.ad_account_id ? String(row.ad_account_id) : null,
    scopes: JSON.parse(String(row.scopes_json)) as string[],
    mock: Boolean(row.mock),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapCampaignRow(row: Record<string, unknown>): MetaAdsCampaignRecord {
  return {
    campaignId: String(row.campaign_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    name: String(row.name),
    objective: String(row.objective),
    status: row.status as MetaAdsCampaignRecord["status"],
    budgetCents: Number(row.budget_cents),
    budgetType: row.budget_type as MetaAdsCampaignRecord["budgetType"],
    currency: String(row.currency),
    audience: JSON.parse(String(row.audience_json)),
    creative: row.creative_json ? JSON.parse(String(row.creative_json)) : null,
    metaCampaignId: row.meta_campaign_id ? String(row.meta_campaign_id) : null,
    metaAdSetId: row.meta_ad_set_id ? String(row.meta_ad_set_id) : null,
    metaAdId: row.meta_ad_id ? String(row.meta_ad_id) : null,
    metaCreativeId: row.meta_creative_id ? String(row.meta_creative_id) : null,
    founderApprovalToken: row.founder_approval_token ? String(row.founder_approval_token) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    approvedAt: row.approved_at ? String(row.approved_at) : null,
    report: row.report_json ? JSON.parse(String(row.report_json)) : null,
    lastErrorMessage: row.last_error_message ? String(row.last_error_message) : null,
    mock: Boolean(row.mock),
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

let repositoryInstance: SqliteMetaAdsRepository | null = null;

export function getMetaAdsRepository(): SqliteMetaAdsRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteMetaAdsRepository();
  }
  return repositoryInstance;
}

export function resetMetaAdsRepository(): void {
  repositoryInstance = null;
}

export function createOAuthRecord(
  input: Omit<MetaAdsOAuthRecord, "oauthId" | "createdAt" | "updatedAt"> & {
    oauthId?: string;
  },
): MetaAdsOAuthRecord {
  const timestamp = nowIso();
  return {
    oauthId: input.oauthId ?? randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    accessToken: input.accessToken,
    tokenType: input.tokenType,
    expiresAt: input.expiresAt,
    adAccountId: input.adAccountId,
    scopes: input.scopes,
    mock: input.mock,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createCampaignRecord(
  input: Omit<MetaAdsCampaignRecord, "campaignId" | "createdAt" | "updatedAt"> & {
    campaignId?: string;
  },
): MetaAdsCampaignRecord {
  const timestamp = nowIso();
  return {
    campaignId: input.campaignId ?? randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    name: input.name,
    objective: input.objective,
    status: input.status,
    budgetCents: input.budgetCents,
    budgetType: input.budgetType,
    currency: input.currency,
    audience: input.audience,
    creative: input.creative,
    metaCampaignId: input.metaCampaignId,
    metaAdSetId: input.metaAdSetId,
    metaAdId: input.metaAdId,
    metaCreativeId: input.metaCreativeId,
    founderApprovalToken: input.founderApprovalToken,
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    report: input.report,
    lastErrorMessage: input.lastErrorMessage,
    mock: input.mock,
    metadata: input.metadata,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** SQLite persistence for Meta Ads OAuth and campaigns. */
export class SqliteMetaAdsRepository implements MetaAdsRepository {
  saveOAuth(record: MetaAdsOAuthRecord): MetaAdsOAuthRecord {
    const db = getDatabase();
    const payload = { ...record, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO meta_ads_oauth
        (oauth_id, workspace_id, company_id, access_token, token_type, expires_at,
         ad_account_id, scopes_json, mock, created_at, updated_at)
       VALUES
        (@oauthId, @workspaceId, @companyId, @accessToken, @tokenType, @expiresAt,
         @adAccountId, @scopesJson, @mock, @createdAt, @updatedAt)
       ON CONFLICT(oauth_id) DO UPDATE SET
         access_token = excluded.access_token,
         token_type = excluded.token_type,
         expires_at = excluded.expires_at,
         ad_account_id = excluded.ad_account_id,
         scopes_json = excluded.scopes_json,
         mock = excluded.mock,
         updated_at = excluded.updated_at`,
    ).run({
      oauthId: payload.oauthId,
      workspaceId: payload.workspaceId,
      companyId: payload.companyId,
      accessToken: payload.accessToken,
      tokenType: payload.tokenType,
      expiresAt: payload.expiresAt,
      adAccountId: payload.adAccountId,
      scopesJson: JSON.stringify(payload.scopes),
      mock: payload.mock ? 1 : 0,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    });

    return payload;
  }

  getOAuth(workspaceId: string, companyId?: string): MetaAdsOAuthRecord | null {
    const db = getDatabase();
    const row = companyId
      ? db
          .prepare(
            `SELECT * FROM meta_ads_oauth
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY updated_at DESC LIMIT 1`,
          )
          .get({ workspaceId, companyId })
      : db
          .prepare(
            `SELECT * FROM meta_ads_oauth
             WHERE workspace_id = @workspaceId
             ORDER BY updated_at DESC LIMIT 1`,
          )
          .get({ workspaceId });

    return row ? mapOAuthRow(row as Record<string, unknown>) : null;
  }

  saveCampaign(record: MetaAdsCampaignRecord): MetaAdsCampaignRecord {
    const db = getDatabase();
    const payload = { ...record, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO meta_ads_campaigns
        (campaign_id, workspace_id, company_id, name, objective, status,
         budget_cents, budget_type, currency, audience_json, creative_json,
         meta_campaign_id, meta_ad_set_id, meta_ad_id, meta_creative_id,
         founder_approval_token, approved_by, approved_at, report_json,
         last_error_message, mock, metadata_json, created_at, updated_at)
       VALUES
        (@campaignId, @workspaceId, @companyId, @name, @objective, @status,
         @budgetCents, @budgetType, @currency, @audienceJson, @creativeJson,
         @metaCampaignId, @metaAdSetId, @metaAdId, @metaCreativeId,
         @founderApprovalToken, @approvedBy, @approvedAt, @reportJson,
         @lastErrorMessage, @mock, @metadataJson, @createdAt, @updatedAt)
       ON CONFLICT(campaign_id) DO UPDATE SET
         name = excluded.name,
         objective = excluded.objective,
         status = excluded.status,
         budget_cents = excluded.budget_cents,
         budget_type = excluded.budget_type,
         currency = excluded.currency,
         audience_json = excluded.audience_json,
         creative_json = excluded.creative_json,
         meta_campaign_id = excluded.meta_campaign_id,
         meta_ad_set_id = excluded.meta_ad_set_id,
         meta_ad_id = excluded.meta_ad_id,
         meta_creative_id = excluded.meta_creative_id,
         founder_approval_token = excluded.founder_approval_token,
         approved_by = excluded.approved_by,
         approved_at = excluded.approved_at,
         report_json = excluded.report_json,
         last_error_message = excluded.last_error_message,
         mock = excluded.mock,
         metadata_json = excluded.metadata_json,
         updated_at = excluded.updated_at`,
    ).run({
      campaignId: payload.campaignId,
      workspaceId: payload.workspaceId,
      companyId: payload.companyId,
      name: payload.name,
      objective: payload.objective,
      status: payload.status,
      budgetCents: payload.budgetCents,
      budgetType: payload.budgetType,
      currency: payload.currency,
      audienceJson: JSON.stringify(payload.audience),
      creativeJson: payload.creative ? JSON.stringify(payload.creative) : null,
      metaCampaignId: payload.metaCampaignId,
      metaAdSetId: payload.metaAdSetId,
      metaAdId: payload.metaAdId,
      metaCreativeId: payload.metaCreativeId,
      founderApprovalToken: payload.founderApprovalToken,
      approvedBy: payload.approvedBy,
      approvedAt: payload.approvedAt,
      reportJson: payload.report ? JSON.stringify(payload.report) : null,
      lastErrorMessage: payload.lastErrorMessage,
      mock: payload.mock ? 1 : 0,
      metadataJson: JSON.stringify(payload.metadata),
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    });

    return payload;
  }

  getCampaignById(campaignId: string): MetaAdsCampaignRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM meta_ads_campaigns WHERE campaign_id = @campaignId`)
      .get({ campaignId });
    return row ? mapCampaignRow(row as Record<string, unknown>) : null;
  }

  listCampaigns(workspaceId: string, companyId?: string): MetaAdsCampaignRecord[] {
    const db = getDatabase();
    const rows = companyId
      ? db
          .prepare(
            `SELECT * FROM meta_ads_campaigns
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY created_at DESC`,
          )
          .all({ workspaceId, companyId })
      : db
          .prepare(
            `SELECT * FROM meta_ads_campaigns
             WHERE workspace_id = @workspaceId
             ORDER BY created_at DESC`,
          )
          .all({ workspaceId });

    return (rows as Record<string, unknown>[]).map(mapCampaignRow);
  }
}
