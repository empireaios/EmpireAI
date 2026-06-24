/** Canonical intelligence module identifiers for the Brain Contract layer. */
export const INTELLIGENCE_MODULE_IDS = [
  "product-scout",
  "product-intelligence",
  "supplier-intelligence",
  "marketing-strategist",
  "cfo",
  "customer-support",
  "seo",
  "pricing",
  "inventory",
  "guardian",
] as const;

export type IntelligenceModuleId = (typeof INTELLIGENCE_MODULE_IDS)[number];

export function isIntelligenceModuleId(value: string): value is IntelligenceModuleId {
  return (INTELLIGENCE_MODULE_IDS as readonly string[]).includes(value);
}

/** Static metadata for planned intelligence modules (contract catalog, no runtime engines). */
export type IntelligenceModuleCatalogEntry = {
  moduleId: IntelligenceModuleId;
  moduleName: string;
  moduleVersion: string;
  status: "active" | "prepared" | "planned";
  description: string;
};

export const INTELLIGENCE_MODULE_CATALOG: readonly IntelligenceModuleCatalogEntry[] = [
  {
    moduleId: "product-scout",
    moduleName: "AI Product Scout",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Product opportunity evaluation with Empire scoring and Guardian gates",
  },
  {
    moduleId: "product-intelligence",
    moduleName: "Product Intelligence Engine",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Product scoring, demand analysis, and SELL/DO_NOT_SELL/REVIEW recommendations",
  },
  {
    moduleId: "supplier-intelligence",
    moduleName: "AI Supplier Intelligence",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Supplier discovery, trust scoring, fake detection, and SELL/REVIEW/REJECT recommendations",
  },
  {
    moduleId: "marketing-strategist",
    moduleName: "Marketing Strategist",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Campaign strategy, content planning, and channel optimization",
  },
  {
    moduleId: "cfo",
    moduleName: "AI CFO",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Financial analysis, margin signals, and treasury-aware recommendations",
  },
  {
    moduleId: "customer-support",
    moduleName: "Customer Support",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Customer issue triage, retention signals, and support recommendations",
  },
  {
    moduleId: "seo",
    moduleName: "SEO Intelligence",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Search visibility analysis and organic growth recommendations",
  },
  {
    moduleId: "pricing",
    moduleName: "Pricing Intelligence",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Dynamic pricing analysis and margin-aware price recommendations",
  },
  {
    moduleId: "inventory",
    moduleName: "Inventory Intelligence",
    moduleVersion: "0.0.1",
    status: "planned",
    description: "Stock level monitoring, reorder signals, and fulfillment risk alerts",
  },
  {
    moduleId: "guardian",
    moduleName: "Guardian",
    moduleVersion: "1.0.0",
    status: "active",
    description: "Risk assessment, architecture validation, and policy enforcement gates",
  },
] as const;
