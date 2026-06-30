import { z } from "zod";

const metaAdsEnvSchema = z.object({
  META_ADS_APP_ID: z.string().optional(),
  META_ADS_APP_SECRET: z.string().optional(),
  META_ADS_REDIRECT_URI: z.string().default("http://localhost:4000/meta-ads/oauth/callback"),
  META_ADS_ACCESS_TOKEN: z.string().optional(),
  META_ADS_AD_ACCOUNT_ID: z.string().optional(),
  META_ADS_LAUNCH_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  META_ADS_MOCK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  META_ADS_GRAPH_VERSION: z.string().default("v19.0"),
});

export type MetaAdsEnv = z.infer<typeof metaAdsEnvSchema>;

export function loadMetaAdsEnv(env: NodeJS.ProcessEnv = process.env): MetaAdsEnv {
  const parsed = metaAdsEnvSchema.parse(env);
  const hasLiveCredentials = Boolean(
    parsed.META_ADS_APP_ID &&
      parsed.META_ADS_APP_SECRET &&
      (parsed.META_ADS_ACCESS_TOKEN || parsed.META_ADS_AD_ACCOUNT_ID),
  );
  const mockMode = parsed.META_ADS_MOCK || !hasLiveCredentials;

  return { ...parsed, META_ADS_MOCK: mockMode };
}

export function isMetaAdsLaunchAllowed(config: MetaAdsEnv): boolean {
  return config.META_ADS_LAUNCH_ENABLED;
}

export function isMetaAdsLiveConfigured(config: MetaAdsEnv): boolean {
  return Boolean(
    !config.META_ADS_MOCK &&
      config.META_ADS_APP_ID &&
      config.META_ADS_APP_SECRET &&
      (config.META_ADS_ACCESS_TOKEN || config.META_ADS_AD_ACCOUNT_ID),
  );
}
