import { z } from "zod";

const analyticsConversionEnvSchema = z.object({
  ANALYTICS_CONVERSION_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  ANALYTICS_SERVER_SIDE_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  GA4_MEASUREMENT_ID: z.string().optional(),
  GA4_API_SECRET: z.string().optional(),
  META_PIXEL_ID: z.string().optional(),
  META_CONVERSIONS_ACCESS_TOKEN: z.string().optional(),
  TIKTOK_PIXEL_ID: z.string().optional(),
  TIKTOK_ACCESS_TOKEN: z.string().optional(),
  ANALYTICS_DEFAULT_CURRENCY: z.string().default("USD"),
});

export type AnalyticsConversionEnv = z.infer<typeof analyticsConversionEnvSchema>;

export function loadAnalyticsConversionEnv(
  env: NodeJS.ProcessEnv = process.env,
): AnalyticsConversionEnv {
  const parsed = analyticsConversionEnvSchema.parse(env);
  const hasGa4 = Boolean(parsed.GA4_MEASUREMENT_ID && parsed.GA4_API_SECRET);
  const hasMeta = Boolean(parsed.META_PIXEL_ID && parsed.META_CONVERSIONS_ACCESS_TOKEN);
  const hasTikTok = Boolean(parsed.TIKTOK_PIXEL_ID && parsed.TIKTOK_ACCESS_TOKEN);
  const mockMode = parsed.ANALYTICS_SERVER_SIDE_MOCK || (!hasGa4 && !hasMeta && !hasTikTok);

  return { ...parsed, ANALYTICS_SERVER_SIDE_MOCK: mockMode };
}

export function isServerSideLiveConfigured(config: AnalyticsConversionEnv): boolean {
  return !config.ANALYTICS_SERVER_SIDE_MOCK;
}
