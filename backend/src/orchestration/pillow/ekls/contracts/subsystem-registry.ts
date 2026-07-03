/**
 * EKLS — Permanent subsystem registry.
 * @see CANONICAL_EKLS_SPECIFICATION.md
 */

export const EKLS_SUBSYSTEM_IDS = [
  "knowledge_store",
  "experience_store",
  "learning_store",
  "evidence_store",
  "decision_history",
  "outcome_history",
  "confidence_history",
  "observation_store",
  "pattern_store",
  "feature_store",
  "model_store",
  "knowledge_graph",
  "semantic_memory",
  "vector_memory",
  "document_memory",
  "workflow_memory",
  "mission_memory",
  "audit_memory",
  "connector_memory",
  "marketplace_memory",
  "supplier_memory",
  "customer_memory",
  "financial_memory",
  "advertising_memory",
  "product_memory",
  "country_memory",
  "brand_memory",
  "category_memory",
] as const;

export type EklsSubsystemId = (typeof EKLS_SUBSYSTEM_IDS)[number];

export type EklsSubsystemDefinition = {
  id: EklsSubsystemId;
  label: string;
  description: string;
  owner: "pillow";
  dataMode: "live" | "partial" | "reserved" | "architecture";
};

export const EKLS_SUBSYSTEM_REGISTRY: readonly EklsSubsystemDefinition[] = [
  { id: "knowledge_store", label: "Knowledge Store", description: "Canonical business facts", owner: "pillow", dataMode: "partial" },
  { id: "experience_store", label: "Experience Store", description: "Historical operational experience", owner: "pillow", dataMode: "partial" },
  { id: "learning_store", label: "Learning Store", description: "Accumulated learned knowledge", owner: "pillow", dataMode: "live" },
  { id: "evidence_store", label: "Evidence Store", description: "Supporting evidence", owner: "pillow", dataMode: "partial" },
  { id: "decision_history", label: "Decision History", description: "Historical decisions", owner: "pillow", dataMode: "partial" },
  { id: "outcome_history", label: "Outcome History", description: "Observed outcomes", owner: "pillow", dataMode: "partial" },
  { id: "confidence_history", label: "Confidence History", description: "Confidence evolution", owner: "pillow", dataMode: "architecture" },
  { id: "observation_store", label: "Observation Store", description: "Platform observations", owner: "pillow", dataMode: "partial" },
  { id: "pattern_store", label: "Pattern Store", description: "Discovered behavioural patterns", owner: "pillow", dataMode: "architecture" },
  { id: "feature_store", label: "Feature Store", description: "Reusable analytical features — never hardcoded in engines", owner: "pillow", dataMode: "architecture" },
  { id: "model_store", label: "Model Store", description: "Model metadata only", owner: "pillow", dataMode: "architecture" },
  { id: "knowledge_graph", label: "Knowledge Graph", description: "Queryable relationships", owner: "pillow", dataMode: "partial" },
  { id: "semantic_memory", label: "Semantic Memory", description: "Meaning-based retrieval", owner: "pillow", dataMode: "architecture" },
  { id: "vector_memory", label: "Vector Memory", description: "Reserved", owner: "pillow", dataMode: "reserved" },
  { id: "document_memory", label: "Document Memory", description: "Repository knowledge", owner: "pillow", dataMode: "live" },
  { id: "workflow_memory", label: "Workflow Memory", description: "Workflow history", owner: "pillow", dataMode: "architecture" },
  { id: "mission_memory", label: "Mission Memory", description: "Mission history", owner: "pillow", dataMode: "partial" },
  { id: "audit_memory", label: "Audit Memory", description: "Executive audit history", owner: "pillow", dataMode: "partial" },
  { id: "connector_memory", label: "Connector Memory", description: "Connector history", owner: "pillow", dataMode: "architecture" },
  { id: "marketplace_memory", label: "Marketplace Memory", description: "Marketplace knowledge", owner: "pillow", dataMode: "partial" },
  { id: "supplier_memory", label: "Supplier Memory", description: "Supplier knowledge", owner: "pillow", dataMode: "partial" },
  { id: "customer_memory", label: "Customer Memory", description: "Customer knowledge", owner: "pillow", dataMode: "partial" },
  { id: "financial_memory", label: "Financial Memory", description: "Financial knowledge", owner: "pillow", dataMode: "partial" },
  { id: "advertising_memory", label: "Advertising Memory", description: "Advertising knowledge", owner: "pillow", dataMode: "partial" },
  { id: "product_memory", label: "Product Memory", description: "Product knowledge", owner: "pillow", dataMode: "partial" },
  { id: "country_memory", label: "Country Memory", description: "Country knowledge", owner: "pillow", dataMode: "partial" },
  { id: "brand_memory", label: "Brand Memory", description: "Brand knowledge", owner: "pillow", dataMode: "partial" },
  { id: "category_memory", label: "Category Memory", description: "Category knowledge", owner: "pillow", dataMode: "partial" },
];

export const EKLS_FEATURE_CATALOG_EXAMPLES = [
  "profit_margin",
  "supplier_reliability",
  "market_saturation",
  "advertising_roas",
  "inventory_velocity",
  "product_confidence",
  "marketplace_growth",
  "competition_density",
  "customer_lifetime_value",
  "conversion_rate",
  "refund_rate",
] as const;
