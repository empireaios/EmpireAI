import { z } from "zod";

/** DNS record required for deployment. */
export type DomainDnsRecord = {
  type: string;
  name: string;
  value: string;
  purpose: string;
};

/** Domain and DNS requirements for a deployment plan. */
export type DomainRequirements = {
  primaryDomain: string;
  subdomainAllowed: boolean;
  sslRequired: boolean;
  dnsRecords: DomainDnsRecord[];
  notes: string;
};

export const domainDnsRecordSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  value: z.string().min(1),
  purpose: z.string().min(1),
});

export const domainRequirementsSchema = z.object({
  primaryDomain: z.string().min(1),
  subdomainAllowed: z.boolean(),
  sslRequired: z.boolean(),
  dnsRecords: z.array(domainDnsRecordSchema).min(1),
  notes: z.string().min(1),
});

/** Validates DomainRequirements record shape. */
export function validateDomainRequirements(value: unknown): DomainRequirements {
  return domainRequirementsSchema.parse(value);
}
