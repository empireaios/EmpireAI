import type { CreateKnowledgeEdgeInput } from "../models/knowledge-graph.js";
import type { CreateKnowledgeObjectInput } from "../models/knowledge-object.js";
import type { CreateLearningRecordInput } from "../models/learning-record.js";

/** K-001/K-002/K-003 seed knowledge — bootstrapped from commerce architecture, extensible without limit. */
export const KNOWLEDGE_SEED_OBJECTS: Array<CreateKnowledgeObjectInput & { objectId: string }> = [
  { objectId: "ko-country-sg", objectType: "country", displayName: "Singapore", externalRef: "SG", attributes: { region: "apac" }, tags: ["apac", "high-growth"], confidence: 85, source: "INTELLIGENCE" },
  { objectId: "ko-country-us", objectType: "country", displayName: "United States", externalRef: "US", attributes: { region: "americas" }, tags: ["americas", "high-value"], confidence: 90, source: "INTELLIGENCE" },
  { objectId: "ko-country-gb", objectType: "country", displayName: "United Kingdom", externalRef: "GB", attributes: { region: "emea" }, tags: ["emea"], confidence: 82, source: "INTELLIGENCE" },
  { objectId: "ko-mp-shopee-sg", objectType: "marketplace", displayName: "Shopee SG", externalRef: "shopee-sg", attributes: { countryCode: "SG" }, tags: ["marketplace", "apac"], confidence: 78, source: "SEED" },
  { objectId: "ko-mp-amazon-us", objectType: "marketplace", displayName: "Amazon US", externalRef: "amazon-us", attributes: { countryCode: "US" }, tags: ["marketplace", "amazon"], confidence: 88, source: "SEED" },
  { objectId: "ko-mp-shopify-us", objectType: "marketplace", displayName: "Shopify US", externalRef: "shopify-us", attributes: { countryCode: "US", runtimePluginId: "shopify" }, tags: ["marketplace", "shopify"], confidence: 75, source: "SEED" },
  { objectId: "ko-supplier-cj", objectType: "supplier", displayName: "CJ Dropshipping", externalRef: "cj-dropshipping", attributes: { type: "dropshipping" }, tags: ["supplier", "global"], confidence: 70, source: "OPERATION" },
  { objectId: "ko-product-electronics-001", objectType: "product", displayName: "Wireless Earbuds Pro", attributes: { category: "electronics", sku: "WEP-001" }, tags: ["electronics", "hero"], confidence: 72, source: "SEED" },
  { objectId: "ko-product-fashion-001", objectType: "product", displayName: "Minimalist Activewear Set", attributes: { category: "fashion" }, tags: ["fashion"], confidence: 68, source: "SEED" },
  { objectId: "ko-launch-electronics-sg-2025", objectType: "launch", displayName: "Electronics Launch SG 2025", attributes: { category: "electronics", countryCode: "SG", outcome: "success" }, tags: ["launch", "electronics", "success"], confidence: 80, source: "SEED" },
  { objectId: "ko-launch-fashion-us-2025", objectType: "launch", displayName: "Fashion Launch US 2025", attributes: { category: "fashion", countryCode: "US", outcome: "partial" }, tags: ["launch", "fashion"], confidence: 65, source: "SEED" },
  { objectId: "ko-success-earbuds-shopee", objectType: "success", displayName: "Earbuds success on Shopee SG", attributes: { roi: "HIGH", category: "electronics" }, tags: ["success", "electronics"], confidence: 85, source: "SEED" },
  { objectId: "ko-failure-supplier-delay", objectType: "failure", displayName: "Supplier delay on fashion SKU", attributes: { category: "fashion", reason: "fulfillment_delay" }, tags: ["failure", "supplier"], confidence: 78, source: "SEED" },
  { objectId: "ko-campaign-meta-us", objectType: "campaign", displayName: "Meta Ads US Electronics", attributes: { channel: "meta", countryCode: "US" }, tags: ["advertising", "meta"], confidence: 70, source: "SEED" },
  { objectId: "ko-customer-us-millennial", objectType: "customer", displayName: "US Millennial Tech Buyer", attributes: { segment: "millennial", countryCode: "US" }, tags: ["customer", "segment"], confidence: 60, source: "SEED" },
  { objectId: "ko-business-grand-king", objectType: "business", displayName: "Grand King Account", externalRef: "co-grand-king", attributes: { accountType: "grand_king" }, tags: ["business"], confidence: 95, source: "OPERATION" },
  { objectId: "ko-competition-earbuds-sg", objectType: "competition", displayName: "Earbuds competition SG", attributes: { category: "electronics", intensity: "HIGH" }, tags: ["competition", "electronics"], confidence: 75, source: "INTELLIGENCE" },
];

export const KNOWLEDGE_SEED_EDGES: Array<CreateKnowledgeEdgeInput & { edgeId: string }> = [
  { edgeId: "ke-1", fromObjectId: "ko-product-electronics-001", toObjectId: "ko-success-earbuds-shopee", relationship: "SUCCEEDED_ON", weight: 85, evidence: "Product achieved target ROAS on Shopee SG" },
  { edgeId: "ke-2", fromObjectId: "ko-success-earbuds-shopee", toObjectId: "ko-mp-shopee-sg", relationship: "PERFORMED_BEST_ON", weight: 88, evidence: "Highest conversion vs other SG marketplaces" },
  { edgeId: "ke-3", fromObjectId: "ko-success-earbuds-shopee", toObjectId: "ko-country-sg", relationship: "LAUNCHED_IN", weight: 90, evidence: "Successful country launch" },
  { edgeId: "ke-4", fromObjectId: "ko-product-electronics-001", toObjectId: "ko-supplier-cj", relationship: "SUPPLIED_BY", weight: 70, evidence: "CJ fulfilled electronics SKU" },
  { edgeId: "ke-5", fromObjectId: "ko-launch-electronics-sg-2025", toObjectId: "ko-product-electronics-001", relationship: "RELATED_TO", weight: 80, evidence: "Launch featured electronics hero SKU" },
  { edgeId: "ke-6", fromObjectId: "ko-launch-electronics-sg-2025", toObjectId: "ko-campaign-meta-us", relationship: "PROMOTED_VIA", weight: 60, evidence: "Cross-market campaign learnings applied" },
  { edgeId: "ke-7", fromObjectId: "ko-campaign-meta-us", toObjectId: "ko-customer-us-millennial", relationship: "TARGETS", weight: 75, evidence: "Campaign targeted millennial segment" },
  { edgeId: "ke-8", fromObjectId: "ko-product-fashion-001", toObjectId: "ko-failure-supplier-delay", relationship: "FAILED_ON", weight: 72, evidence: "Fashion SKU hit supplier delay" },
  { edgeId: "ke-9", fromObjectId: "ko-failure-supplier-delay", toObjectId: "ko-supplier-cj", relationship: "LEARNED_FROM", weight: 68, evidence: "Supplier reliability lesson recorded" },
  { edgeId: "ke-10", fromObjectId: "ko-product-electronics-001", toObjectId: "ko-competition-earbuds-sg", relationship: "COMPETES_WITH", weight: 80, evidence: "High competition in SG electronics" },
  { edgeId: "ke-11", fromObjectId: "ko-launch-fashion-us-2025", toObjectId: "ko-country-us", relationship: "LAUNCHED_IN", weight: 85, evidence: "Fashion launch targeted US" },
  { edgeId: "ke-12", fromObjectId: "ko-launch-fashion-us-2025", toObjectId: "ko-mp-amazon-us", relationship: "SUCCEEDED_ON", weight: 55, evidence: "Partial success on Amazon US" },
];

export const KNOWLEDGE_SEED_LEARNINGS: Array<CreateLearningRecordInput & { learningId: string }> = [
  {
    learningId: "lr-seed-1",
    observation: "Electronics hero SKUs convert faster on APAC marketplaces with localized listings",
    evidence: "Shopee SG launch outperformed US Shopify by 2.3x ROAS in seed simulation",
    confidence: 82,
    source: "SEED",
    importance: "HIGH",
    relatedObjectIds: ["ko-product-electronics-001", "ko-mp-shopee-sg", "ko-country-sg"],
    recommendation: "Prioritize APAC marketplace localization for electronics category",
    tags: ["electronics", "apac", "localization"],
  },
  {
    learningId: "lr-seed-2",
    observation: "Supplier fulfillment delays disproportionately impact fashion category margins",
    evidence: "Fashion SKU delay increased return rate in seed failure record",
    confidence: 75,
    source: "SUPPLIER_EVENT",
    importance: "HIGH",
    relatedObjectIds: ["ko-product-fashion-001", "ko-failure-supplier-delay", "ko-supplier-cj"],
    recommendation: "Require backup supplier for fashion before multi-country launch",
    tags: ["fashion", "supplier", "risk"],
  },
  {
    learningId: "lr-seed-3",
    observation: "US Meta campaigns drive awareness but marketplace conversion varies by category",
    evidence: "Meta US electronics campaign linked to millennial segment with moderate downstream conversion",
    confidence: 68,
    source: "GLOBAL_COMMERCE_INTELLIGENCE",
    importance: "MEDIUM",
    relatedObjectIds: ["ko-campaign-meta-us", "ko-customer-us-millennial", "ko-mp-amazon-us"],
    recommendation: "Pair Meta awareness with marketplace-specific retargeting",
    tags: ["advertising", "us", "campaign"],
  },
  {
    learningId: "lr-seed-4",
    observation: "Repeat success pattern: electronics + SG + Shopee + CJ supplier chain",
    evidence: "Graph path product → success → marketplace → country with supplier edge",
    confidence: 85,
    source: "LAUNCH_EVENT",
    importance: "CRITICAL",
    relatedObjectIds: ["ko-product-electronics-001", "ko-success-earbuds-shopee", "ko-mp-shopee-sg", "ko-supplier-cj"],
    recommendation: "Replicate electronics APAC playbook for similar SKUs",
    tags: ["pattern", "success", "electronics"],
  },
];
