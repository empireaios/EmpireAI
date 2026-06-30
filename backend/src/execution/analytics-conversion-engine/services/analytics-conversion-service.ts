import { loadAnalyticsConversionEnv } from "../config/analytics-conversion-env.js";
import type {
  AnalyticsPlatform,
  ConversionEventName,
  ConversionRecord,
  PixelConfig,
  RoasSnapshot,
  ServerSideEventRecord,
} from "../models/analytics-conversion-record.js";
import {
  createConversionRecord,
  createPixelConfigRecord,
  createRoasSnapshotRecord,
  createServerEventRecord,
  getAnalyticsConversionRepository,
} from "../repositories/sqlite-analytics-conversion-repository.js";
import { dispatchServerSideEvent } from "./server-side-event-service.js";

export class AnalyticsConversionBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsConversionBlockedError";
  }
}

export type RegisterPixelConfigInput = {
  workspaceId: string;
  companyId: string;
  storeId?: string;
  ga4MeasurementId?: string;
  ga4ApiSecret?: string;
  metaPixelId?: string;
  metaAccessToken?: string;
  tiktokPixelId?: string;
  tiktokAccessToken?: string;
};

export type TrackServerEventInput = {
  workspaceId: string;
  companyId: string;
  eventName: ConversionEventName;
  correlationId: string;
  valueCents: number;
  currency?: string;
  customerEmail?: string;
  platforms?: AnalyticsPlatform[];
  payload?: Record<string, string>;
};

export type TrackPurchaseInput = {
  workspaceId: string;
  companyId: string;
  storeId?: string;
  paymentId?: string;
  pipelineId?: string;
  correlationId: string;
  valueCents: number;
  currency?: string;
  customerEmail?: string;
};

export type RecordAdSpendInput = {
  workspaceId: string;
  companyId: string;
  campaignId: string;
  amountCents: number;
  currency?: string;
  channel: "META" | "TIKTOK" | "GOOGLE" | "OTHER";
};

function assertAnalyticsEnabled(): void {
  const env = loadAnalyticsConversionEnv();
  if (!env.ANALYTICS_CONVERSION_ENABLED) {
    throw new AnalyticsConversionBlockedError("ANALYTICS_CONVERSION_ENABLED is false");
  }
}

/** Registers or updates pixel configuration for a workspace. */
export function registerPixelConfig(input: RegisterPixelConfigInput): PixelConfig {
  const repository = getAnalyticsConversionRepository();
  const existing = repository.getPixelConfig(input.workspaceId, input.companyId);

  const config = createPixelConfigRecord({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    storeId: input.storeId ?? null,
    ga4MeasurementId: input.ga4MeasurementId ?? existing?.ga4MeasurementId ?? null,
    ga4ApiSecret: input.ga4ApiSecret ?? existing?.ga4ApiSecret ?? null,
    metaPixelId: input.metaPixelId ?? existing?.metaPixelId ?? null,
    metaAccessToken: input.metaAccessToken ?? existing?.metaAccessToken ?? null,
    tiktokPixelId: input.tiktokPixelId ?? existing?.tiktokPixelId ?? null,
    tiktokAccessToken: input.tiktokAccessToken ?? existing?.tiktokAccessToken ?? null,
    enabled: true,
  });

  if (existing) {
    return repository.savePixelConfig({ ...config, configId: existing.configId, createdAt: existing.createdAt });
  }
  return repository.savePixelConfig(config);
}

/** Dispatches a server-side analytics event to GA4, Meta, and TikTok. */
export async function trackServerSideEvent(
  input: TrackServerEventInput,
): Promise<ServerSideEventRecord> {
  assertAnalyticsEnabled();
  const repository = getAnalyticsConversionRepository();

  const existing = repository.getServerEventByCorrelation(input.correlationId, input.eventName);
  if (existing) return existing;

  const pixelConfig = repository.getPixelConfig(input.workspaceId, input.companyId);
  const currency = (input.currency ?? loadAnalyticsConversionEnv().ANALYTICS_DEFAULT_CURRENCY).toUpperCase();
  const platforms = input.platforms ?? (["GA4", "META", "TIKTOK"] as AnalyticsPlatform[]);

  const dispatch = await dispatchServerSideEvent(
    pixelConfig,
    {
      eventName: input.eventName,
      correlationId: input.correlationId,
      valueCents: input.valueCents,
      currency,
      customerEmail: input.customerEmail,
    },
    platforms,
  );

  return repository.saveServerEvent(
    createServerEventRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      eventName: input.eventName,
      platforms,
      correlationId: input.correlationId,
      valueCents: input.valueCents,
      currency,
      customerEmail: input.customerEmail ?? null,
      payload: input.payload ?? {},
      dispatchResults: dispatch.results,
      mock: dispatch.mock,
    }),
  );
}

/** Tracks a real purchase conversion with server-side events and persisted conversion record. */
export async function trackPurchaseConversion(
  input: TrackPurchaseInput,
): Promise<{ conversion: ConversionRecord; serverEvent: ServerSideEventRecord }> {
  assertAnalyticsEnabled();
  const repository = getAnalyticsConversionRepository();

  const existing = repository.getConversionByCorrelation(input.correlationId);
  if (existing) {
    const serverEvent = repository.getServerEventByCorrelation(input.correlationId, "purchase");
    if (serverEvent) return { conversion: existing, serverEvent };
  }

  const serverEvent = await trackServerSideEvent({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    eventName: "purchase",
    correlationId: input.correlationId,
    valueCents: input.valueCents,
    currency: input.currency,
    customerEmail: input.customerEmail,
    payload: {
      paymentId: input.paymentId ?? "",
      storeId: input.storeId ?? "",
      pipelineId: input.pipelineId ?? "",
    },
  });

  const conversion = repository.saveConversion(
    createConversionRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      storeId: input.storeId ?? null,
      paymentId: input.paymentId ?? null,
      pipelineId: input.pipelineId ?? null,
      eventName: "purchase",
      valueCents: input.valueCents,
      currency: serverEvent.currency,
      correlationId: input.correlationId,
      platforms: serverEvent.platforms,
      serverEventId: serverEvent.eventId,
      attributed: true,
    }),
  );

  return { conversion, serverEvent };
}

/** Records ad spend for ROAS calculation. */
export function recordAdSpend(input: RecordAdSpendInput): void {
  getAnalyticsConversionRepository().recordAdSpend({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    campaignId: input.campaignId,
    amountCents: input.amountCents,
    currency: (input.currency ?? "USD").toUpperCase(),
    channel: input.channel,
  });
}

/** Computes and persists ROAS snapshot from conversions and ad spend. */
export function computeRoasSnapshot(input: {
  workspaceId: string;
  companyId: string;
  period?: string;
}): RoasSnapshot {
  const repository = getAnalyticsConversionRepository();
  const conversions = repository
    .listConversions(input.workspaceId, input.companyId)
    .filter((conversion) => conversion.eventName === "purchase");

  const revenueCents = conversions.reduce((sum, conversion) => sum + conversion.valueCents, 0);
  const adSpendCents = repository.sumAdSpend(input.workspaceId, input.companyId);
  const roas = adSpendCents > 0 ? Number((revenueCents / adSpendCents).toFixed(4)) : 0;

  return repository.saveRoasSnapshot(
    createRoasSnapshotRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      period: input.period ?? "all_time",
      revenueCents,
      adSpendCents,
      roas,
      conversionCount: conversions.length,
      currency: "USD",
    }),
  );
}

export function getPixelConfig(workspaceId: string, companyId?: string): PixelConfig | null {
  return getAnalyticsConversionRepository().getPixelConfig(workspaceId, companyId);
}

export function listConversions(workspaceId: string, companyId?: string): ConversionRecord[] {
  return getAnalyticsConversionRepository().listConversions(workspaceId, companyId);
}

export function listServerEvents(workspaceId: string, limit?: number): ServerSideEventRecord[] {
  return getAnalyticsConversionRepository().listServerEvents(workspaceId, limit);
}

export function getLatestRoasSnapshot(
  workspaceId: string,
  companyId?: string,
): RoasSnapshot | null {
  return getAnalyticsConversionRepository().getLatestRoasSnapshot(workspaceId, companyId);
}

/** Tracks purchase from M103 live payment record shape. */
export async function trackPurchaseFromPayment(input: {
  paymentId: string;
  workspaceId: string;
  companyId: string;
  storeId?: string | null;
  amountCents: number;
  currency: string;
  correlationId: string;
  customerEmail?: string | null;
}): Promise<{ conversion: ConversionRecord; serverEvent: ServerSideEventRecord }> {
  return trackPurchaseConversion({
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    storeId: input.storeId ?? undefined,
    paymentId: input.paymentId,
    correlationId: input.correlationId,
    valueCents: input.amountCents,
    currency: input.currency,
    customerEmail: input.customerEmail ?? undefined,
  });
}
