import {
  MARKETPLACE_ADAPTERS,
  MARKETPLACE_PUBLISH_IDS,
  type MarketplacePublishId,
} from "../../marketplace-publishing/models/marketplace-adapter.js";
import { formatForMarketplace } from "../../marketplace-publishing/services/marketplace-formatter-service.js";
import type { MarketplaceDifferenceEngine } from "../models/marketplace-difference-engine.js";

type ItemStatus = MarketplaceDifferenceEngine["items"][number]["status"];

const EXTENDED_MARKETPLACE_IDS = ["tiktok-shop", "walmart", "mercadolibre", "rakuten"] as const;

type MarketplaceRuleSet = Record<string, { limit: string; score: number; note: string }>;

const DEFAULT_MARKETPLACE_RULES: MarketplaceRuleSet = {
  image: { limit: "1000×1000 min · lifestyle + detail mix", score: 75, note: "Marketplace-standard visual baseline" },
  title: { limit: "80–150 chars typical", score: 72, note: "Mobile-first title truncation" },
  description: { limit: "Bullets + specs · platform HTML varies", score: 70, note: "Adapt copy per channel formatter" },
  category: { limit: "Platform taxonomy mapping required", score: 68, note: "Cross-list category alignment" },
  fees: { limit: "Referral 10–18% typical", score: 62, note: "Model net margin after fees" },
  shipping: { limit: "Channel-specific SLA · cross-border surcharges", score: 65, note: "Align with SUP-005 acceptability" },
  seo: { limit: "Channel search + external ads synergy", score: 70, note: "Listing SEO + paid amplification" },
  approval: { limit: "Draft → validate → King approval → publish", score: 58, note: "Governance gate before live listing" },
};

const MARKETPLACE_RULES: Record<string, MarketplaceRuleSet> = {
  amazon: {
    image: { limit: "Main 1000×1000 min · white background · 7 images max", score: 72, note: "Strict main image policy" },
    title: { limit: "200 chars · no promotional phrases", score: 68, note: "Keyword-rich but policy-safe titles" },
    description: { limit: "A+ content preferred · no HTML in flat file", score: 70, note: "Structured bullets + backend keywords" },
    category: { limit: "Browse node required · product type gate", score: 65, note: "Category misclassification triggers suppression" },
    fees: { limit: "Referral 8–15% + FBA optional", score: 60, note: "Fee stack affects margin floor" },
    shipping: { limit: "Prime badge expectation · 2-day norm US", score: 75, note: "FBA or competitive ship windows" },
    seo: { limit: "Backend keywords 250 bytes · no keyword stuffing", score: 78, note: "Search rank drives discovery" },
    approval: { limit: "Brand registry · restricted categories gated", score: 55, note: "King approval + category unlock required" },
  },
  shopify: {
    image: { limit: "2048×2048 recommended · unlimited images", score: 90, note: "Flexible creative control" },
    title: { limit: "255 chars · brand-forward", score: 85, note: "Direct-to-consumer storytelling" },
    description: { limit: "HTML rich text supported", score: 88, note: "Full narrative + conversion blocks" },
    category: { limit: "Product type + collections", score: 82, note: "Collection-based merchandising" },
    fees: { limit: "Plan + payment gateway ~2.9%", score: 80, note: "Lower referral than marketplaces" },
    shipping: { limit: "Merchant-defined · 3–7 day norm", score: 70, note: "Set expectations on product page" },
    seo: { limit: "Meta title/description · URL handle", score: 84, note: "Organic traffic lever" },
    approval: { limit: "Self-serve publish · app review for integrations", score: 92, note: "Fastest publish path when credentials live" },
  },
};

const RULE_LABELS: Record<string, string> = {
  image: "Image rules",
  title: "Title limits",
  description: "Description rules",
  category: "Category rules",
  fees: "Fees",
  shipping: "Shipping",
  seo: "SEO",
  approval: "Approval requirements",
};

const SAMPLE_LISTING = {
  title: "Wireless Kitchen Timer Pro — Precision Digital Display",
  description: "Professional kitchen timer with magnetic mount and loud alarm.",
  bulletPoints: ["Large LCD display", "Magnetic back", "AAA batteries included"],
  specifications: { Material: "ABS", Color: "White" },
  price: 29.99,
  images: ["https://cdn.example.com/timer-main.jpg"],
};

function itemStatus(score: number): ItemStatus {
  if (score >= 75) return "READY";
  if (score >= 55) return "PENDING";
  return "BLOCKED";
}

function allMarketplaceIds(): string[] {
  return [...MARKETPLACE_PUBLISH_IDS, ...EXTENDED_MARKETPLACE_IDS];
}

function formatterValidated(marketplaceId: string): boolean {
  if (!(MARKETPLACE_PUBLISH_IDS as readonly string[]).includes(marketplaceId)) return true;
  const payload = formatForMarketplace(marketplaceId as MarketplacePublishId, SAMPLE_LISTING);
  return Object.keys(payload).length > 0;
}

/** REAL-073 — Marketplace difference engine (formatForMarketplace + per-channel rules). */
export function buildMarketplaceDifferenceEngine(
  workspaceId: string,
  companyId: string,
): MarketplaceDifferenceEngine {
  void workspaceId;
  void companyId;

  const items: MarketplaceDifferenceEngine["items"] = [];

  for (const marketplaceId of allMarketplaceIds()) {
    const baseAdapter = MARKETPLACE_ADAPTERS.find((a) => a.marketplaceId === marketplaceId);
    const displayName = baseAdapter?.displayName
      ?? marketplaceId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const rules = MARKETPLACE_RULES[marketplaceId] ?? DEFAULT_MARKETPLACE_RULES;
    const formatterWorks = formatterValidated(marketplaceId);

    for (const ruleKey of Object.keys(RULE_LABELS)) {
      const rule = rules[ruleKey] ?? DEFAULT_MARKETPLACE_RULES[ruleKey];
      if (!rule) continue;
      const score = formatterWorks ? rule.score : Math.max(40, rule.score - 15);
      items.push({
        itemId: `${marketplaceId}-${ruleKey}`,
        label: `${displayName} — ${RULE_LABELS[ruleKey] ?? ruleKey}`,
        score,
        status: itemStatus(score),
        recommendation: rule.note,
        evidence: rule.limit,
        why: `Channel-specific ${RULE_LABELS[ruleKey]?.toLowerCase() ?? ruleKey} prevents listing rejection and protects margin on ${displayName}`,
      });
    }
  }

  const readyCount = items.filter((i) => i.status === "READY").length;

  return {
    moduleId: "marketplace-difference-engine",
    missionId: "REAL-073",
    workspaceId,
    companyId,
    summary: `${allMarketplaceIds().length} marketplaces × 8 rule dimensions · ${readyCount} ready · formatter validated on core adapters`,
    items,
    reusedModules: ["marketplace-publishing"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
