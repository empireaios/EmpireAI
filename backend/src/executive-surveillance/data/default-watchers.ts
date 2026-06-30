import type { ExecutiveWatcher } from "../models/surveillance-core.js";

/** ESS-002 — Initial watcher registry (19 permanent watchers). */
export const DEFAULT_WATCHERS: Omit<ExecutiveWatcher, "registeredAt">[] = [
  { watcherId: "ceo-watcher", title: "CEO Watcher", domain: "strategy", watchedModules: ["operation-first-dollar", "empire-self-inspection", "executive-council"], active: true },
  { watcherId: "commercial-watcher", title: "Commercial Watcher", domain: "commercial", watchedModules: ["commerce-intelligence-studio"], active: true },
  { watcherId: "merchant-watcher", title: "Merchant Watcher", domain: "merchandising", watchedModules: ["commerce-intelligence-studio"], active: true },
  { watcherId: "marketing-watcher", title: "Marketing Watcher", domain: "marketing", watchedModules: ["execution-layer", "eye-series"], active: true },
  { watcherId: "brand-watcher", title: "Brand Watcher", domain: "brand", watchedModules: ["commerce-intelligence-studio", "business-opportunity-workspace"], active: true },
  { watcherId: "customer-watcher", title: "Customer Watcher", domain: "customer", watchedModules: ["customer-order-pipeline", "operation-first-dollar"], active: true },
  { watcherId: "finance-watcher", title: "Finance Watcher", domain: "finance", watchedModules: ["operation-first-dollar", "commerce-intelligence-studio"], active: true },
  { watcherId: "supply-chain-watcher", title: "Supply Chain Watcher", domain: "supply_chain", watchedModules: ["reality-integration", "commerce-intelligence-studio"], active: true },
  { watcherId: "marketplace-watcher", title: "Marketplace Watcher", domain: "marketplace", watchedModules: ["amazon-global-seller", "commerce-runtime"], active: true },
  { watcherId: "expansion-watcher", title: "Expansion Watcher", domain: "expansion", watchedModules: ["global-commerce-intelligence", "global-commerce-infrastructure"], active: true },
  { watcherId: "operations-watcher", title: "Operations Watcher", domain: "operations", watchedModules: ["commerce-runtime", "founder-automation"], active: true },
  { watcherId: "risk-watcher", title: "Risk Watcher", domain: "risk", watchedModules: ["reality-integration", "executive-council"], active: true },
  { watcherId: "knowledge-watcher", title: "Knowledge Watcher", domain: "knowledge", watchedModules: ["empire-knowledge"], active: true },
  { watcherId: "automation-watcher", title: "Automation Watcher", domain: "automation", watchedModules: ["founder-automation"], active: true },
  { watcherId: "technology-watcher", title: "Technology Watcher", domain: "technology", watchedModules: ["empire-self-inspection", "commerce-runtime"], active: true },
  { watcherId: "legal-watcher", title: "Legal Watcher", domain: "legal", watchedModules: ["reality-integration", "global-commerce-infrastructure"], active: true },
  { watcherId: "data-watcher", title: "Data Watcher", domain: "data", watchedModules: ["empire-knowledge", "empire-self-inspection"], active: true },
  { watcherId: "growth-watcher", title: "Growth Watcher", domain: "growth", watchedModules: ["global-commerce-intelligence", "operation-first-dollar"], active: true },
  { watcherId: "experiment-watcher", title: "Experiment Watcher", domain: "experimentation", watchedModules: ["commerce-intelligence-studio"], active: true },
];

export function seedDefaultWatchers(registeredAt: string): ExecutiveWatcher[] {
  return DEFAULT_WATCHERS.map((w) => ({ ...w, registeredAt }));
}
