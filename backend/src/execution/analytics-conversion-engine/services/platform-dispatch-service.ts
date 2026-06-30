import { createHash } from "node:crypto";

import type { PixelConfig } from "../models/analytics-conversion-record.js";
import { loadAnalyticsConversionEnv } from "../config/analytics-conversion-env.js";

export type ServerEventPayload = {
  eventName: string;
  correlationId: string;
  valueCents: number;
  currency: string;
  customerEmail?: string | null;
  clientIp?: string;
  userAgent?: string;
  eventSourceUrl?: string;
};

function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function resolvePixelConfig(config: PixelConfig | null) {
  const env = loadAnalyticsConversionEnv();
  return {
    ga4MeasurementId: config?.ga4MeasurementId ?? env.GA4_MEASUREMENT_ID ?? null,
    ga4ApiSecret: config?.ga4ApiSecret ?? env.GA4_API_SECRET ?? null,
    metaPixelId: config?.metaPixelId ?? env.META_PIXEL_ID ?? null,
    metaAccessToken: config?.metaAccessToken ?? env.META_CONVERSIONS_ACCESS_TOKEN ?? null,
    tiktokPixelId: config?.tiktokPixelId ?? env.TIKTOK_PIXEL_ID ?? null,
    tiktokAccessToken: config?.tiktokAccessToken ?? env.TIKTOK_ACCESS_TOKEN ?? null,
    mock: env.ANALYTICS_SERVER_SIDE_MOCK,
  };
}

/** Sends a purchase event to GA4 Measurement Protocol. */
export async function sendGa4ServerEvent(
  config: PixelConfig | null,
  payload: ServerEventPayload,
): Promise<"sent" | "mock" | "failed"> {
  const resolved = resolvePixelConfig(config);
  if (!resolved.ga4MeasurementId || !resolved.ga4ApiSecret) {
    return resolved.mock ? "mock" : "failed";
  }
  if (resolved.mock) return "mock";

  const ga4EventName =
    payload.eventName === "purchase"
      ? "purchase"
      : payload.eventName === "begin_checkout"
        ? "begin_checkout"
        : payload.eventName;

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(resolved.ga4MeasurementId)}&api_secret=${encodeURIComponent(resolved.ga4ApiSecret)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: payload.correlationId,
        events: [
          {
            name: ga4EventName,
            params: {
              currency: payload.currency,
              value: payload.valueCents / 100,
              transaction_id: payload.correlationId,
            },
          },
        ],
      }),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

/** Sends a conversion event to Meta Conversions API. */
export async function sendMetaServerEvent(
  config: PixelConfig | null,
  payload: ServerEventPayload,
): Promise<"sent" | "mock" | "failed"> {
  const resolved = resolvePixelConfig(config);
  if (!resolved.metaPixelId || !resolved.metaAccessToken) {
    return resolved.mock ? "mock" : "failed";
  }
  if (resolved.mock) return "mock";

  const metaEventName =
    payload.eventName === "purchase"
      ? "Purchase"
      : payload.eventName === "begin_checkout"
        ? "InitiateCheckout"
        : "PageView";

  const userData: Record<string, string> = {};
  if (payload.customerEmail) {
    userData.em = hashEmail(payload.customerEmail);
  }
  if (payload.clientIp) userData.client_ip_address = payload.clientIp;
  if (payload.userAgent) userData.client_user_agent = payload.userAgent;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${resolved.metaPixelId}/events?access_token=${encodeURIComponent(resolved.metaAccessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: metaEventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: payload.correlationId,
              action_source: "website",
              event_source_url: payload.eventSourceUrl ?? "https://grandkings.account",
              user_data: userData,
              custom_data: {
                currency: payload.currency,
                value: payload.valueCents / 100,
              },
            },
          ],
        }),
      },
    );
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

/** Sends an event to TikTok Events API. */
export async function sendTikTokServerEvent(
  config: PixelConfig | null,
  payload: ServerEventPayload,
): Promise<"sent" | "mock" | "failed"> {
  const resolved = resolvePixelConfig(config);
  if (!resolved.tiktokPixelId || !resolved.tiktokAccessToken) {
    return resolved.mock ? "mock" : "failed";
  }
  if (resolved.mock) return "mock";

  const tiktokEvent =
    payload.eventName === "purchase"
      ? "CompletePayment"
      : payload.eventName === "begin_checkout"
        ? "InitiateCheckout"
        : "ViewContent";

  try {
    const response = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": resolved.tiktokAccessToken,
        },
        body: JSON.stringify({
          event_source: "web",
          event_source_id: resolved.tiktokPixelId,
          data: [
            {
              event: tiktokEvent,
              event_time: Math.floor(Date.now() / 1000).toString(),
              event_id: payload.correlationId,
              user: payload.customerEmail ? { email: hashEmail(payload.customerEmail) } : {},
              properties: {
                currency: payload.currency,
                value: payload.valueCents / 100,
                content_type: "product",
              },
            },
          ],
        }),
      },
    );
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
