import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  ConversionRecord,
  PixelConfig,
  RoasSnapshot,
  ServerSideEventRecord,
} from "../models/analytics-conversion-record.js";
import type { AnalyticsConversionRepository } from "./analytics-conversion-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapPixelRow(row: Record<string, unknown>): PixelConfig {
  return {
    configId: String(row.config_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    storeId: row.store_id ? String(row.store_id) : null,
    ga4MeasurementId: row.ga4_measurement_id ? String(row.ga4_measurement_id) : null,
    ga4ApiSecret: row.ga4_api_secret ? String(row.ga4_api_secret) : null,
    metaPixelId: row.meta_pixel_id ? String(row.meta_pixel_id) : null,
    metaAccessToken: row.meta_access_token ? String(row.meta_access_token) : null,
    tiktokPixelId: row.tiktok_pixel_id ? String(row.tiktok_pixel_id) : null,
    tiktokAccessToken: row.tiktok_access_token ? String(row.tiktok_access_token) : null,
    enabled: Boolean(row.enabled),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapServerEventRow(row: Record<string, unknown>): ServerSideEventRecord {
  return {
    eventId: String(row.event_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    eventName: row.event_name as ServerSideEventRecord["eventName"],
    platforms: JSON.parse(String(row.platforms_json)) as ServerSideEventRecord["platforms"],
    correlationId: String(row.correlation_id),
    valueCents: Number(row.value_cents),
    currency: String(row.currency),
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    payload: JSON.parse(String(row.payload_json)),
    dispatchResults: JSON.parse(String(row.dispatch_results_json)),
    mock: Boolean(row.mock),
    createdAt: String(row.created_at),
  };
}

function mapConversionRow(row: Record<string, unknown>): ConversionRecord {
  return {
    conversionId: String(row.conversion_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    storeId: row.store_id ? String(row.store_id) : null,
    paymentId: row.payment_id ? String(row.payment_id) : null,
    pipelineId: row.pipeline_id ? String(row.pipeline_id) : null,
    eventName: row.event_name as ConversionRecord["eventName"],
    valueCents: Number(row.value_cents),
    currency: String(row.currency),
    correlationId: String(row.correlation_id),
    platforms: JSON.parse(String(row.platforms_json)) as ConversionRecord["platforms"],
    serverEventId: String(row.server_event_id),
    attributed: Boolean(row.attributed),
    createdAt: String(row.created_at),
  };
}

function mapRoasRow(row: Record<string, unknown>): RoasSnapshot {
  return {
    snapshotId: String(row.snapshot_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    period: String(row.period),
    revenueCents: Number(row.revenue_cents),
    adSpendCents: Number(row.ad_spend_cents),
    roas: Number(row.roas),
    conversionCount: Number(row.conversion_count),
    currency: String(row.currency),
    computedAt: String(row.computed_at),
  };
}

/** SQLite persistence for analytics conversion engine. */
export class SqliteAnalyticsConversionRepository implements AnalyticsConversionRepository {
  savePixelConfig(input: PixelConfig): PixelConfig {
    const db = getDatabase();
    const record = { ...input, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO analytics_pixel_configs
        (config_id, workspace_id, company_id, store_id, ga4_measurement_id, ga4_api_secret,
         meta_pixel_id, meta_access_token, tiktok_pixel_id, tiktok_access_token,
         enabled, created_at, updated_at)
       VALUES
        (@configId, @workspaceId, @companyId, @storeId, @ga4MeasurementId, @ga4ApiSecret,
         @metaPixelId, @metaAccessToken, @tiktokPixelId, @tiktokAccessToken,
         @enabled, @createdAt, @updatedAt)
       ON CONFLICT(config_id) DO UPDATE SET
         ga4_measurement_id = excluded.ga4_measurement_id,
         ga4_api_secret = excluded.ga4_api_secret,
         meta_pixel_id = excluded.meta_pixel_id,
         meta_access_token = excluded.meta_access_token,
         tiktok_pixel_id = excluded.tiktok_pixel_id,
         tiktok_access_token = excluded.tiktok_access_token,
         enabled = excluded.enabled,
         updated_at = excluded.updated_at`,
    ).run({
      configId: record.configId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      storeId: record.storeId,
      ga4MeasurementId: record.ga4MeasurementId,
      ga4ApiSecret: record.ga4ApiSecret,
      metaPixelId: record.metaPixelId,
      metaAccessToken: record.metaAccessToken,
      tiktokPixelId: record.tiktokPixelId,
      tiktokAccessToken: record.tiktokAccessToken,
      enabled: record.enabled ? 1 : 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    return record;
  }

  getPixelConfig(workspaceId: string, companyId?: string): PixelConfig | null {
    const db = getDatabase();
    const row = companyId
      ? (db
          .prepare(
            `SELECT * FROM analytics_pixel_configs
             WHERE workspace_id = @workspaceId AND company_id = @companyId AND enabled = 1
             ORDER BY updated_at DESC LIMIT 1`,
          )
          .get({ workspaceId, companyId }) as Record<string, unknown> | undefined)
      : (db
          .prepare(
            `SELECT * FROM analytics_pixel_configs
             WHERE workspace_id = @workspaceId AND enabled = 1
             ORDER BY updated_at DESC LIMIT 1`,
          )
          .get({ workspaceId }) as Record<string, unknown> | undefined);
    return row ? mapPixelRow(row) : null;
  }

  saveServerEvent(event: ServerSideEventRecord): ServerSideEventRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO analytics_server_events
        (event_id, workspace_id, company_id, event_name, platforms_json, correlation_id,
         value_cents, currency, customer_email, payload_json, dispatch_results_json,
         mock, created_at)
       VALUES
        (@eventId, @workspaceId, @companyId, @eventName, @platformsJson, @correlationId,
         @valueCents, @currency, @customerEmail, @payloadJson, @dispatchResultsJson,
         @mock, @createdAt)
       ON CONFLICT(event_id) DO NOTHING`,
    ).run({
      eventId: event.eventId,
      workspaceId: event.workspaceId,
      companyId: event.companyId,
      eventName: event.eventName,
      platformsJson: JSON.stringify(event.platforms),
      correlationId: event.correlationId,
      valueCents: event.valueCents,
      currency: event.currency,
      customerEmail: event.customerEmail,
      payloadJson: JSON.stringify(event.payload),
      dispatchResultsJson: JSON.stringify(event.dispatchResults),
      mock: event.mock ? 1 : 0,
      createdAt: event.createdAt,
    });
    return event;
  }

  getServerEventByCorrelation(
    correlationId: string,
    eventName: string,
  ): ServerSideEventRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM analytics_server_events
         WHERE correlation_id = @correlationId AND event_name = @eventName LIMIT 1`,
      )
      .get({ correlationId, eventName }) as Record<string, unknown> | undefined;
    return row ? mapServerEventRow(row) : null;
  }

  listServerEvents(workspaceId: string, limit = 100): ServerSideEventRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM analytics_server_events
         WHERE workspace_id = @workspaceId ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit }) as Record<string, unknown>[];
    return rows.map(mapServerEventRow);
  }

  saveConversion(conversion: ConversionRecord): ConversionRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO analytics_conversions
        (conversion_id, workspace_id, company_id, store_id, payment_id, pipeline_id,
         event_name, value_cents, currency, correlation_id, platforms_json,
         server_event_id, attributed, created_at)
       VALUES
        (@conversionId, @workspaceId, @companyId, @storeId, @paymentId, @pipelineId,
         @eventName, @valueCents, @currency, @correlationId, @platformsJson,
         @serverEventId, @attributed, @createdAt)
       ON CONFLICT(conversion_id) DO NOTHING`,
    ).run({
      conversionId: conversion.conversionId,
      workspaceId: conversion.workspaceId,
      companyId: conversion.companyId,
      storeId: conversion.storeId,
      paymentId: conversion.paymentId,
      pipelineId: conversion.pipelineId,
      eventName: conversion.eventName,
      valueCents: conversion.valueCents,
      currency: conversion.currency,
      correlationId: conversion.correlationId,
      platformsJson: JSON.stringify(conversion.platforms),
      serverEventId: conversion.serverEventId,
      attributed: conversion.attributed ? 1 : 0,
      createdAt: conversion.createdAt,
    });
    return conversion;
  }

  getConversionByCorrelation(correlationId: string): ConversionRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM analytics_conversions WHERE correlation_id = @correlationId LIMIT 1`,
      )
      .get({ correlationId }) as Record<string, unknown> | undefined;
    return row ? mapConversionRow(row) : null;
  }

  listConversions(workspaceId: string, companyId?: string): ConversionRecord[] {
    const db = getDatabase();
    const rows = companyId
      ? (db
          .prepare(
            `SELECT * FROM analytics_conversions
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY created_at DESC`,
          )
          .all({ workspaceId, companyId }) as Record<string, unknown>[])
      : (db
          .prepare(
            `SELECT * FROM analytics_conversions
             WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
          )
          .all({ workspaceId }) as Record<string, unknown>[]);
    return rows.map(mapConversionRow);
  }

  saveRoasSnapshot(snapshot: RoasSnapshot): RoasSnapshot {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO analytics_roas_snapshots
        (snapshot_id, workspace_id, company_id, period, revenue_cents, ad_spend_cents,
         roas, conversion_count, currency, computed_at)
       VALUES
        (@snapshotId, @workspaceId, @companyId, @period, @revenueCents, @adSpendCents,
         @roas, @conversionCount, @currency, @computedAt)`,
    ).run({
      snapshotId: snapshot.snapshotId,
      workspaceId: snapshot.workspaceId,
      companyId: snapshot.companyId,
      period: snapshot.period,
      revenueCents: snapshot.revenueCents,
      adSpendCents: snapshot.adSpendCents,
      roas: snapshot.roas,
      conversionCount: snapshot.conversionCount,
      currency: snapshot.currency,
      computedAt: snapshot.computedAt,
    });
    return snapshot;
  }

  getLatestRoasSnapshot(workspaceId: string, companyId?: string): RoasSnapshot | null {
    const db = getDatabase();
    const row = companyId
      ? (db
          .prepare(
            `SELECT * FROM analytics_roas_snapshots
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY computed_at DESC LIMIT 1`,
          )
          .get({ workspaceId, companyId }) as Record<string, unknown> | undefined)
      : (db
          .prepare(
            `SELECT * FROM analytics_roas_snapshots
             WHERE workspace_id = @workspaceId ORDER BY computed_at DESC LIMIT 1`,
          )
          .get({ workspaceId }) as Record<string, unknown> | undefined);
    return row ? mapRoasRow(row) : null;
  }

  recordAdSpend(input: {
    workspaceId: string;
    companyId: string;
    campaignId: string;
    amountCents: number;
    currency: string;
    channel: string;
  }): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO analytics_ad_spend
        (id, workspace_id, company_id, campaign_id, amount_cents, currency, channel, recorded_at)
       VALUES (@id, @workspaceId, @companyId, @campaignId, @amountCents, @currency, @channel, @recordedAt)`,
    ).run({
      id: randomUUID(),
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      campaignId: input.campaignId,
      amountCents: input.amountCents,
      currency: input.currency,
      channel: input.channel,
      recordedAt: nowIso(),
    });
  }

  sumAdSpend(workspaceId: string, companyId?: string): number {
    const db = getDatabase();
    const row = companyId
      ? (db
          .prepare(
            `SELECT COALESCE(SUM(amount_cents), 0) AS total
             FROM analytics_ad_spend WHERE workspace_id = @workspaceId AND company_id = @companyId`,
          )
          .get({ workspaceId, companyId }) as { total: number })
      : (db
          .prepare(
            `SELECT COALESCE(SUM(amount_cents), 0) AS total
             FROM analytics_ad_spend WHERE workspace_id = @workspaceId`,
          )
          .get({ workspaceId }) as { total: number });
    return Number(row.total);
  }
}

let defaultRepository: SqliteAnalyticsConversionRepository | null = null;

export function getAnalyticsConversionRepository(): AnalyticsConversionRepository {
  if (!defaultRepository) {
    defaultRepository = new SqliteAnalyticsConversionRepository();
  }
  return defaultRepository;
}

export function createPixelConfigRecord(
  input: Omit<PixelConfig, "configId" | "createdAt" | "updatedAt">,
): PixelConfig {
  const timestamp = nowIso();
  return {
    ...input,
    configId: randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createConversionRecord(
  input: Omit<ConversionRecord, "conversionId" | "createdAt">,
): ConversionRecord {
  return {
    ...input,
    conversionId: randomUUID(),
    createdAt: nowIso(),
  };
}

export function createServerEventRecord(
  input: Omit<ServerSideEventRecord, "eventId" | "createdAt">,
): ServerSideEventRecord {
  return {
    ...input,
    eventId: randomUUID(),
    createdAt: nowIso(),
  };
}

export function createRoasSnapshotRecord(
  input: Omit<RoasSnapshot, "snapshotId" | "computedAt">,
): RoasSnapshot {
  return {
    ...input,
    snapshotId: randomUUID(),
    computedAt: nowIso(),
  };
}
