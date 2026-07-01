/**
 * Operating Cost model — UX-001 Mission Home (owner: REAL-051 / REAL-019 economics).
 *
 * Frontend-seeded, King-editable structure. Values persist to localStorage so the
 * Grand King can enter ACTUAL monthly costs today; the same shape is ready to be
 * fed by a live backend feed later without changing the table UI.
 */

export type OperatingCostCategory = "infrastructure" | "ai";

export interface OperatingCostItem {
  id: string;
  component: string;
  provider: string;
  category: OperatingCostCategory;
  /** Monthly cost in USD. 0 = not yet entered by the Grand King. */
  monthlyCostUsd: number;
  /** ISO timestamp of the last King edit, or "" when never edited. */
  updatedAt: string;
}

const STORAGE_KEY = "empire.operatingCost.v1";

/** Default operating-cost catalogue. Costs start at 0 until the King enters reality. */
export const DEFAULT_OPERATING_COST: OperatingCostItem[] = [
  { id: "hosting", component: "App Hosting & Compute", provider: "Render / Fly.io", category: "infrastructure", monthlyCostUsd: 0, updatedAt: "" },
  { id: "database", component: "Database", provider: "Neon (Postgres)", category: "infrastructure", monthlyCostUsd: 0, updatedAt: "" },
  { id: "storage", component: "Object Storage & CDN", provider: "Cloudflare R2", category: "infrastructure", monthlyCostUsd: 0, updatedAt: "" },
  { id: "domain", component: "Domain & DNS", provider: "Cloudflare", category: "infrastructure", monthlyCostUsd: 0, updatedAt: "" },
  { id: "email", component: "Transactional Email", provider: "Resend / Postmark", category: "infrastructure", monthlyCostUsd: 0, updatedAt: "" },
  { id: "monitoring", component: "Monitoring & Logs", provider: "Better Stack", category: "infrastructure", monthlyCostUsd: 0, updatedAt: "" },
  { id: "llm-primary", component: "Primary LLM (Reasoning)", provider: "Anthropic Claude", category: "ai", monthlyCostUsd: 0, updatedAt: "" },
  { id: "llm-secondary", component: "Secondary LLM (Drafting)", provider: "OpenAI", category: "ai", monthlyCostUsd: 0, updatedAt: "" },
  { id: "embeddings", component: "Embeddings & Search", provider: "OpenAI / Voyage", category: "ai", monthlyCostUsd: 0, updatedAt: "" },
  { id: "image-ai", component: "Image Generation", provider: "Replicate / Fal", category: "ai", monthlyCostUsd: 0, updatedAt: "" },
];

export const OPERATING_COST_CATEGORY_LABELS: Record<OperatingCostCategory, string> = {
  infrastructure: "Infrastructure",
  ai: "AI",
};

/** Load King-entered costs, merged over defaults so newly-added components still appear. */
export function loadOperatingCost(): OperatingCostItem[] {
  if (typeof window === "undefined") return DEFAULT_OPERATING_COST.map((item) => ({ ...item }));
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OPERATING_COST.map((item) => ({ ...item }));
    const parsed = JSON.parse(raw) as Array<Partial<OperatingCostItem>>;
    return DEFAULT_OPERATING_COST.map((def) => {
      const stored = parsed.find((entry) => entry.id === def.id);
      if (!stored) return { ...def };
      return {
        ...def,
        monthlyCostUsd:
          typeof stored.monthlyCostUsd === "number" && !Number.isNaN(stored.monthlyCostUsd)
            ? stored.monthlyCostUsd
            : def.monthlyCostUsd,
        updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : def.updatedAt,
      };
    });
  } catch {
    return DEFAULT_OPERATING_COST.map((item) => ({ ...item }));
  }
}

/** Persist only the King-editable fields. */
export function saveOperatingCost(items: OperatingCostItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload = items.map((item) => ({
      id: item.id,
      monthlyCostUsd: item.monthlyCostUsd,
      updatedAt: item.updatedAt,
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* localStorage unavailable — non-fatal */
  }
}

export function categoryTotal(items: OperatingCostItem[], category: OperatingCostCategory): number {
  return items
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + (item.monthlyCostUsd || 0), 0);
}

export function overallOperatingCost(items: OperatingCostItem[]): number {
  return items.reduce((sum, item) => sum + (item.monthlyCostUsd || 0), 0);
}
