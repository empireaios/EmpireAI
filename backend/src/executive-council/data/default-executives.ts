import type { RegisteredExecutive } from "../models/executive-registry.js";

const NOW = new Date(0).toISOString();

/** EC-002 — Initial executive registry (20 permanent executives). */
export const DEFAULT_EXECUTIVES: Omit<RegisteredExecutive, "registeredAt">[] = [
  { executiveId: "ceo", role: "CEO", title: "Chief Executive Officer", domain: "strategy", focusAreas: ["vision", "priorities", "capital allocation"], certificationStatus: "ACTIVE", maturity: "VETERAN" },
  { executiveId: "cco", role: "CCO", title: "Chief Commercial Officer", domain: "commercial", focusAreas: ["revenue", "pricing", "commercial strategy"], certificationStatus: "ACTIVE", maturity: "ESTABLISHED" },
  { executiveId: "cmo-merchant", role: "CMO", title: "Chief Merchant Officer", domain: "merchandising", focusAreas: ["assortment", "catalog", "product mix"], certificationStatus: "ACTIVE", maturity: "ESTABLISHED" },
  { executiveId: "cmo-marketing", role: "CMO", title: "Chief Marketing Officer", domain: "marketing", focusAreas: ["acquisition", "campaigns", "channels"], certificationStatus: "ACTIVE", maturity: "ESTABLISHED" },
  { executiveId: "cbo", role: "CBO", title: "Chief Brand Officer", domain: "brand", focusAreas: ["positioning", "identity", "trust"], certificationStatus: "ACTIVE", maturity: "DEVELOPING" },
  { executiveId: "cxo", role: "CXO", title: "Chief Customer Officer", domain: "customer", focusAreas: ["experience", "retention", "support"], certificationStatus: "ACTIVE", maturity: "ESTABLISHED" },
  { executiveId: "cfo", role: "CFO", title: "Chief Financial Officer", domain: "finance", focusAreas: ["margin", "cash flow", "unit economics"], certificationStatus: "ACTIVE", maturity: "VETERAN" },
  { executiveId: "csco", role: "CSCO", title: "Chief Supply Chain Officer", domain: "supply_chain", focusAreas: ["sourcing", "logistics", "fulfillment"], certificationStatus: "ACTIVE", maturity: "ESTABLISHED" },
  { executiveId: "cmo-marketplace", role: "CMO", title: "Chief Marketplace Officer", domain: "marketplace", focusAreas: ["listings", "platforms", "marketplace ops"], certificationStatus: "ACTIVE", maturity: "DEVELOPING" },
  { executiveId: "cxo-expansion", role: "CXO", title: "Chief Expansion Officer", domain: "expansion", focusAreas: ["geography", "new markets", "localization"], certificationStatus: "ACTIVE", maturity: "DEVELOPING" },
  { executiveId: "coo", role: "COO", title: "Chief Operations Officer", domain: "operations", focusAreas: ["execution", "process", "efficiency"], certificationStatus: "ACTIVE", maturity: "ESTABLISHED" },
  { executiveId: "cro", role: "CRO", title: "Chief Risk Officer", domain: "risk", focusAreas: ["compliance risk", "operational risk", "reputation"], certificationStatus: "ACTIVE", maturity: "VETERAN" },
  { executiveId: "cko", role: "CKO", title: "Chief Knowledge Officer", domain: "knowledge", focusAreas: ["learnings", "doctrine", "institutional memory"], certificationStatus: "ACTIVE", maturity: "ESTABLISHED" },
  { executiveId: "cio-intel", role: "CIO", title: "Chief Intelligence Officer", domain: "intelligence", focusAreas: ["signals", "competitive intel", "market data"], certificationStatus: "ACTIVE", maturity: "DEVELOPING" },
  { executiveId: "cao", role: "CAO", title: "Chief Automation Officer", domain: "automation", focusAreas: ["workflows", "founder load", "automation ROI"], certificationStatus: "ACTIVE", maturity: "EMERGING" },
  { executiveId: "cto", role: "CTO", title: "Chief Technology Officer", domain: "technology", focusAreas: ["platform", "architecture", "integrations"], certificationStatus: "ACTIVE", maturity: "ESTABLISHED" },
  { executiveId: "clo", role: "CLO", title: "Chief Legal & Compliance Officer", domain: "legal", focusAreas: ["compliance", "contracts", "regulatory"], certificationStatus: "ACTIVE", maturity: "VETERAN" },
  { executiveId: "cdo", role: "CDO", title: "Chief Data Officer", domain: "data", focusAreas: ["analytics", "data quality", "reporting"], certificationStatus: "ACTIVE", maturity: "DEVELOPING" },
  { executiveId: "cgo", role: "CGO", title: "Chief Growth Officer", domain: "growth", focusAreas: ["scaling", "funnels", "LTV"], certificationStatus: "ACTIVE", maturity: "DEVELOPING" },
  { executiveId: "cxo-experiment", role: "CXO", title: "Chief Experiment Officer", domain: "experimentation", focusAreas: ["tests", "hypotheses", "learning loops"], certificationStatus: "EXPERIMENTAL", maturity: "EMERGING" },
];

export function seedDefaultExecutives(registeredAt = NOW): RegisteredExecutive[] {
  return DEFAULT_EXECUTIVES.map((exec) => ({
    ...exec,
    recommendationCount: 0,
    successRate: undefined,
    registeredAt,
  }));
}

/** Domain relevance weights for debate engine (EC-003). */
export const DOMAIN_SUBJECT_RELEVANCE: Record<string, Record<string, number>> = {
  strategy: { general: 1, product: 0.7, expansion: 0.9, supplier: 0.6, marketplace: 0.7 },
  commercial: { general: 0.8, product: 1, expansion: 0.8, supplier: 0.7, marketplace: 0.9 },
  merchandising: { general: 0.5, product: 1, expansion: 0.5, supplier: 0.8, marketplace: 0.7 },
  marketing: { general: 0.7, product: 0.9, expansion: 0.8, supplier: 0.4, marketplace: 0.8 },
  brand: { general: 0.6, product: 0.9, expansion: 0.7, supplier: 0.5, marketplace: 0.8 },
  customer: { general: 0.8, product: 0.9, expansion: 0.6, supplier: 0.5, marketplace: 0.7 },
  finance: { general: 0.9, product: 1, expansion: 0.8, supplier: 0.8, marketplace: 0.7 },
  supply_chain: { general: 0.6, product: 0.8, expansion: 0.5, supplier: 1, marketplace: 0.6 },
  marketplace: { general: 0.5, product: 0.8, expansion: 0.7, supplier: 0.5, marketplace: 1 },
  expansion: { general: 0.7, product: 0.6, expansion: 1, supplier: 0.5, marketplace: 0.8 },
  operations: { general: 0.8, product: 0.7, expansion: 0.7, supplier: 0.8, marketplace: 0.8 },
  risk: { general: 0.9, product: 0.8, expansion: 0.9, supplier: 0.9, marketplace: 0.8 },
  knowledge: { general: 0.7, product: 0.6, expansion: 0.6, supplier: 0.5, marketplace: 0.5 },
  intelligence: { general: 0.8, product: 0.8, expansion: 0.9, supplier: 0.7, marketplace: 0.8 },
  automation: { general: 0.7, product: 0.5, expansion: 0.5, supplier: 0.6, marketplace: 0.5 },
  technology: { general: 0.8, product: 0.6, expansion: 0.7, supplier: 0.6, marketplace: 0.7 },
  legal: { general: 0.8, product: 0.7, expansion: 1, supplier: 0.8, marketplace: 0.8 },
  data: { general: 0.7, product: 0.8, expansion: 0.7, supplier: 0.6, marketplace: 0.7 },
  growth: { general: 0.8, product: 0.9, expansion: 0.9, supplier: 0.5, marketplace: 0.8 },
  experimentation: { general: 0.6, product: 1, expansion: 0.7, supplier: 0.5, marketplace: 0.7 },
};
