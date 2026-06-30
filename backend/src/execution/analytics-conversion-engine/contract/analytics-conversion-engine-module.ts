/**
 * Analytics & Conversion Engine — real GA4, Meta, TikTok tracking with ROAS.
 */

import type { ConversionRecord, RoasSnapshot } from "../models/analytics-conversion-record.js";
import {
  computeRoasSnapshot,
  getLatestRoasSnapshot,
  listConversions,
  registerPixelConfig,
  trackPurchaseConversion,
  trackServerSideEvent,
} from "../services/analytics-conversion-service.js";

export const ANALYTICS_CONVERSION_ENGINE_MODULE_ID = "analytics-conversion-engine" as const;
export type AnalyticsConversionEngineModuleId = typeof ANALYTICS_CONVERSION_ENGINE_MODULE_ID;
export const ANALYTICS_CONVERSION_ENGINE_VERSION = "0.1.0" as const;

export type AnalyticsConversionCapability =
  | "analytics-conversion.pixels"
  | "analytics-conversion.server-events"
  | "analytics-conversion.conversions"
  | "analytics-conversion.roas";

export const ANALYTICS_CONVERSION_ENGINE_CAPABILITIES: readonly AnalyticsConversionCapability[] = [
  "analytics-conversion.pixels",
  "analytics-conversion.server-events",
  "analytics-conversion.conversions",
  "analytics-conversion.roas",
] as const;

/** Orchestrates real analytics and conversion tracking. */
export class AnalyticsConversionEngineModule {
  readonly moduleId = ANALYTICS_CONVERSION_ENGINE_MODULE_ID;
  readonly version = ANALYTICS_CONVERSION_ENGINE_VERSION;
  readonly capabilities = ANALYTICS_CONVERSION_ENGINE_CAPABILITIES;

  registerPixels = registerPixelConfig;
  trackServerEvent = trackServerSideEvent;
  trackPurchase = trackPurchaseConversion;
  computeRoas = computeRoasSnapshot;
  getRoas = getLatestRoasSnapshot;
  listConversions = listConversions;
}

export function createAnalyticsConversionEngineModule(): AnalyticsConversionEngineModule {
  return new AnalyticsConversionEngineModule();
}

export const analyticsConversionEngineModule = createAnalyticsConversionEngineModule();

export type { ConversionRecord, RoasSnapshot };
