import type { EyeSignalDomain } from "../../../eye/types.js";
import type { BuyerIntentStage, BuyerIntentUrgency } from "../models/buyer-intent.js";
import type { NeedCategoryPriority } from "../models/need-category.js";
import type { PurchaseTriggerType } from "../models/purchase-trigger.js";
import type { AudienceSegmentStatus } from "../models/audience-segment.js";

/** Proposed Buyer Intelligence table names (prefix `bi_`). */
export const BUYER_INTELLIGENCE_TABLES = {
  buyerPersonas: "bi_buyer_personas",
  buyerIntents: "bi_buyer_intents",
  needCategories: "bi_need_categories",
  purchaseTriggers: "bi_purchase_triggers",
  audienceSegments: "bi_audience_segments",
  segmentMemberships: "bi_segment_memberships",
} as const;

export type BuyerIntelligenceTableName =
  (typeof BUYER_INTELLIGENCE_TABLES)[keyof typeof BUYER_INTELLIGENCE_TABLES];

/** SQLite row shape for `bi_buyer_personas` (proposed — no migration in Mission 022). */
export type BiBuyerPersonaRow = {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  demographics_json: string;
  psychographics_json: string;
  pain_points_json: string;
  goals_json: string;
  source_observation_ids_json: string;
  confidence: number;
  tags_json: string;
  created_at: string;
  updated_at: string;
};

/** SQLite row shape for `bi_buyer_intents`. */
export type BiBuyerIntentRow = {
  id: string;
  workspace_id: string;
  persona_id: string | null;
  subject_key: string | null;
  stage: BuyerIntentStage;
  urgency: BuyerIntentUrgency;
  signals_json: string;
  observation_ids_json: string;
  need_category_ids_json: string;
  confidence: number;
  summary: string | null;
  detected_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

/** SQLite row shape for `bi_need_categories`. */
export type BiNeedCategoryRow = {
  id: string;
  workspace_id: string;
  slug: string;
  label: string;
  description: string | null;
  observation_domains_json: string;
  parent_category_id: string | null;
  priority: NeedCategoryPriority;
  keywords_json: string;
  confidence: number;
  created_at: string;
  updated_at: string;
};

/** SQLite row shape for `bi_purchase_triggers`. */
export type BiPurchaseTriggerRow = {
  id: string;
  workspace_id: string;
  name: string;
  trigger_type: PurchaseTriggerType;
  description: string | null;
  conditions_json: string;
  linked_need_category_ids_json: string;
  strength: number;
  observation_ids_json: string;
  active: number;
  window_start: string | null;
  window_end: string | null;
  created_at: string;
  updated_at: string;
};

/** SQLite row shape for `bi_audience_segments`. */
export type BiAudienceSegmentRow = {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: AudienceSegmentStatus;
  rule_operator: "and" | "or";
  rules_json: string;
  persona_ids_json: string;
  need_category_ids_json: string;
  intent_stages_json: string;
  size_estimate_json: string | null;
  tags_json: string;
  created_at: string;
  updated_at: string;
};

/** SQLite row shape for `bi_segment_memberships`. */
export type BiSegmentMembershipRow = {
  id: string;
  workspace_id: string;
  segment_id: string;
  member_ref: string;
  member_type: "persona" | "subject" | "external";
  matched_at: string;
  match_score: number;
  metadata_json: string | null;
};

/** Index definitions proposed for Buyer Intelligence tables. */
export type BuyerIntelligenceIndexSpec = {
  name: string;
  table: BuyerIntelligenceTableName;
  columns: readonly string[];
  unique?: boolean;
};

export const BUYER_INTELLIGENCE_INDEXES: readonly BuyerIntelligenceIndexSpec[] = [
  {
    name: "idx_bi_personas_workspace_slug",
    table: BUYER_INTELLIGENCE_TABLES.buyerPersonas,
    columns: ["workspace_id", "slug"],
    unique: true,
  },
  {
    name: "idx_bi_intents_workspace_stage",
    table: BUYER_INTELLIGENCE_TABLES.buyerIntents,
    columns: ["workspace_id", "stage"],
  },
  {
    name: "idx_bi_need_categories_workspace_slug",
    table: BUYER_INTELLIGENCE_TABLES.needCategories,
    columns: ["workspace_id", "slug"],
    unique: true,
  },
  {
    name: "idx_bi_triggers_workspace_active",
    table: BUYER_INTELLIGENCE_TABLES.purchaseTriggers,
    columns: ["workspace_id", "active"],
  },
  {
    name: "idx_bi_segments_workspace_status",
    table: BUYER_INTELLIGENCE_TABLES.audienceSegments,
    columns: ["workspace_id", "status"],
  },
  {
    name: "idx_bi_memberships_segment",
    table: BUYER_INTELLIGENCE_TABLES.segmentMemberships,
    columns: ["workspace_id", "segment_id"],
  },
] as const;

/** Foreign-key relationships between proposed Buyer Intelligence tables. */
export type BuyerIntelligenceForeignKey = {
  fromTable: BuyerIntelligenceTableName;
  fromColumn: string;
  toTable: BuyerIntelligenceTableName;
  toColumn: string;
};

export const BUYER_INTELLIGENCE_FOREIGN_KEYS: readonly BuyerIntelligenceForeignKey[] = [
  {
    fromTable: BUYER_INTELLIGENCE_TABLES.buyerIntents,
    fromColumn: "persona_id",
    toTable: BUYER_INTELLIGENCE_TABLES.buyerPersonas,
    toColumn: "id",
  },
  {
    fromTable: BUYER_INTELLIGENCE_TABLES.needCategories,
    fromColumn: "parent_category_id",
    toTable: BUYER_INTELLIGENCE_TABLES.needCategories,
    toColumn: "id",
  },
  {
    fromTable: BUYER_INTELLIGENCE_TABLES.segmentMemberships,
    fromColumn: "segment_id",
    toTable: BUYER_INTELLIGENCE_TABLES.audienceSegments,
    toColumn: "id",
  },
] as const;

/** Domains Buyer Intelligence is expected to consume from Eye observations. */
export const BUYER_INTELLIGENCE_OBSERVATION_DOMAINS: readonly EyeSignalDomain[] = [
  "product",
  "trend",
  "market",
  "advertisement",
] as const;

/** SQL sketch for proposed Buyer Intelligence schema (documentation only). */
export const BUYER_INTELLIGENCE_SCHEMA_SQL_SKETCH = `
-- Mission 022 — proposed schema (not applied in this mission)

CREATE TABLE IF NOT EXISTS bi_buyer_personas (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  demographics_json TEXT NOT NULL,
  psychographics_json TEXT NOT NULL,
  pain_points_json TEXT NOT NULL,
  goals_json TEXT NOT NULL,
  source_observation_ids_json TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS bi_buyer_intents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  persona_id TEXT,
  subject_key TEXT,
  stage TEXT NOT NULL CHECK (stage IN ('awareness', 'consideration', 'purchase')),
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  signals_json TEXT NOT NULL DEFAULT '[]',
  observation_ids_json TEXT NOT NULL DEFAULT '[]',
  need_category_ids_json TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0,
  summary TEXT,
  detected_at TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (persona_id) REFERENCES bi_buyer_personas(id)
);

CREATE TABLE IF NOT EXISTS bi_need_categories (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  observation_domains_json TEXT NOT NULL,
  parent_category_id TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  keywords_json TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (workspace_id, slug),
  FOREIGN KEY (parent_category_id) REFERENCES bi_need_categories(id)
);

CREATE TABLE IF NOT EXISTS bi_purchase_triggers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  description TEXT,
  conditions_json TEXT NOT NULL DEFAULT '[]',
  linked_need_category_ids_json TEXT NOT NULL DEFAULT '[]',
  strength REAL NOT NULL DEFAULT 0,
  observation_ids_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  window_start TEXT,
  window_end TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bi_audience_segments (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived')),
  rule_operator TEXT NOT NULL CHECK (rule_operator IN ('and', 'or')),
  rules_json TEXT NOT NULL DEFAULT '[]',
  persona_ids_json TEXT NOT NULL DEFAULT '[]',
  need_category_ids_json TEXT NOT NULL DEFAULT '[]',
  intent_stages_json TEXT NOT NULL DEFAULT '[]',
  size_estimate_json TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (workspace_id, slug)
);

CREATE TABLE IF NOT EXISTS bi_segment_memberships (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  member_ref TEXT NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('persona', 'subject', 'external')),
  matched_at TEXT NOT NULL,
  match_score REAL NOT NULL DEFAULT 0,
  metadata_json TEXT,
  FOREIGN KEY (segment_id) REFERENCES bi_audience_segments(id)
);
`.trim();
