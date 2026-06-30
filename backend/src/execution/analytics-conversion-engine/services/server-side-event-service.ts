import type { AnalyticsPlatform, PixelConfig } from "../models/analytics-conversion-record.js";
import {
  sendGa4ServerEvent,
  sendMetaServerEvent,
  sendTikTokServerEvent,
  type ServerEventPayload,
} from "./platform-dispatch-service.js";

export type DispatchResult = {
  platforms: AnalyticsPlatform[];
  results: Record<AnalyticsPlatform, "sent" | "mock" | "failed">;
  mock: boolean;
};

/** Dispatches a server-side event to GA4, Meta, and TikTok in parallel. */
export async function dispatchServerSideEvent(
  config: PixelConfig | null,
  payload: ServerEventPayload,
  platforms: AnalyticsPlatform[] = ["GA4", "META", "TIKTOK"],
): Promise<DispatchResult> {
  const results = {} as Record<AnalyticsPlatform, "sent" | "mock" | "failed">;

  const tasks = platforms.map(async (platform) => {
    switch (platform) {
      case "GA4":
        results.GA4 = await sendGa4ServerEvent(config, payload);
        break;
      case "META":
        results.META = await sendMetaServerEvent(config, payload);
        break;
      case "TIKTOK":
        results.TIKTOK = await sendTikTokServerEvent(config, payload);
        break;
    }
  });

  await Promise.all(tasks);

  const mock = Object.values(results).every((status) => status === "mock");
  return { platforms, results, mock };
}

export type { ServerEventPayload };
