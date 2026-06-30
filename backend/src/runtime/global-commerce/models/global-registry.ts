import { z } from "zod";

export const CommerceDomainSchema = z.enum([
  "marketplace",
  "supplier",
  "payment",
  "logistics",
  "advertising",
  "analytics",
  "customer_service",
]);

export type CommerceDomain = z.infer<typeof CommerceDomainSchema>;

export const RegionSchema = z.object({
  regionId: z.string(),
  displayName: z.string(),
  countryCodes: z.array(z.string()),
});

export type Region = z.infer<typeof RegionSchema>;

export const CountrySchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  regionId: z.string(),
  currency: z.string(),
  languages: z.array(z.string()),
  commerceDomains: z.array(CommerceDomainSchema),
});

export type Country = z.infer<typeof CountrySchema>;

export const ProviderEntrySchema = z.object({
  providerId: z.string(),
  displayName: z.string(),
  domain: CommerceDomainSchema,
  countryCode: z.string(),
  runtimePluginId: z.string().optional(),
  realityProviderId: z.string().optional(),
});

export type ProviderEntry = z.infer<typeof ProviderEntrySchema>;

export const GlobalCommerceRegistrySnapshotSchema = z.object({
  regions: z.array(RegionSchema),
  countries: z.array(CountrySchema),
  providers: z.array(ProviderEntrySchema),
  totals: z.object({
    regions: z.number(),
    countries: z.number(),
    marketplaces: z.number(),
    suppliers: z.number(),
    payments: z.number(),
  }),
});

export type GlobalCommerceRegistrySnapshot = z.infer<typeof GlobalCommerceRegistrySnapshotSchema>;
