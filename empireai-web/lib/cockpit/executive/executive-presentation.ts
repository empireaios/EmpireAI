/**
 * Mission 007 — Grand King presentation helpers.
 * Progressive disclosure: machine IDs stay under Technical Details.
 */

export type FinancialTruthStatus =
  | "VERIFIED_LIVE"
  | "VERIFIED_AS_OF"
  | "ESTIMATED"
  | "PARTIAL"
  | "STALE"
  | "UNKNOWN"
  | "NOT_YET_VERIFIED";

export type FinancialTruthMeta = {
  status: FinancialTruthStatus;
  source: string;
  asOf?: string | null;
  currency?: string;
  coverage?: string;
  note?: string;
};

/** Human-readable local executive time. */
export function formatGrandKingTime(
  input: string | number | Date | null | undefined,
  opts?: { relative?: boolean },
): string {
  if (input == null || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const absolute = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  if (!opts?.relative) return absolute;
  const deltaMs = Date.now() - d.getTime();
  if (deltaMs < 0) return absolute;
  const mins = Math.floor(deltaMs / 60_000);
  if (mins < 1) return `${absolute} · just now`;
  if (mins < 60) return `${absolute} · ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 36) return `${absolute} · ${hours}h ago`;
  return absolute;
}

export function formatFinancialAmount(
  amount: number | null | undefined,
  meta: FinancialTruthMeta,
): { display: string; label: string } {
  const currency = meta.currency ?? "USD";
  if (amount == null || Number.isNaN(amount)) {
    return {
      display: "—",
      label: meta.status === "NOT_YET_VERIFIED" ? "Not yet verified" : "Unknown",
    };
  }
  const display = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
  const label =
    meta.status === "VERIFIED_AS_OF" && meta.asOf
      ? `Verified as of ${formatGrandKingTime(meta.asOf)}`
      : meta.status.replace(/_/g, " ").toLowerCase();
  return { display, label };
}

/** Scrub machine codes from default Grand King copy. */
export function scrubMachineLanguage(text: string): string {
  return text
    .replace(/\bSUCCESS-\d+\b/gi, "completed milestone")
    .replace(/\bGO-\d+\b/gi, "programme phase")
    .replace(/\bP0-\d+\b/gi, "priority step")
    .replace(/\bB[5-9]\b/g, "system gate")
    .replace(/\bLIVE_COMMERCE_INTEGRATION_MODE\b/g, "commerce live mode")
    .replace(/\bSMART_VIABLE_BATCH_COMPLETE\b/g, "product screening batch finished")
    .replace(/\bSMART[_\s-]?VIABLE\b/gi, "commercially ready product")
    .replace(/\bHONEST[_\s-]?MF[_\s-]?CONFIG[_\s-]?REQUIRED\b/gi, "delivery promise must match real shipping")
    .replace(/\bEMP-FD-[A-Z0-9]+\b/g, "internal SKU")
    .replace(/\bASIN\s+B0[A-Z0-9]+\b/gi, "Amazon listing")
    .replace(/\bB0[A-Z0-9]{8,}\b/g, "Amazon listing")
    .replace(/\bCJ(?:\s+PID)?\s*\d{10,}\b/gi, "supplier product")
    .replace(/\b\d{16,}\b/g, "supplier identifier")
    .replace(/\b[A-Z]{2,}(?:_[A-Z0-9]+)+\b/g, (m) => m.replace(/_/g, " ").toLowerCase());
}

export function humanizeOperatingTerm(raw: string | null | undefined): string {
  if (!raw) return "—";
  const key = raw.trim().toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    COMMISSIONING: "Pillow is being tested before full continuous operation",
    BIRTH_AWAITING_GRAND_KING: "Pillow is ready for continuous operation — waiting for your authorisation",
    TECHNICALLY_READY_AWAITING_GRAND_KING:
      "Pillow is ready for continuous operation — waiting for your authorisation",
    WORKING: "Pillow is actively working",
    WAITING_FOR_GRAND_KING: "Waiting for your decision",
    IDLE_NO_QUALIFYING_WORK: "Idle — no qualifying work right now",
    COST_GUARD_ACTIVE: "Paused by Cost Guard",
    SMART_VIABLE_BATCH_COMPLETE: "Pillow finished screening another batch of products",
    OPERATING_AGE: "Time since Pillow began continuous operation",
  };
  if (map[key]) return map[key];
  return scrubMachineLanguage(raw);
}

export function attentionPriorityLabel(
  priority: string,
): "CRITICAL" | "DECISION" | "IMPORTANT" | "INFORMATION" | "FYI" {
  switch (priority) {
    case "critical_system":
      return "CRITICAL";
    case "money_approval":
    case "important_decision":
      return "DECISION";
    case "commercial_opportunity":
      return "IMPORTANT";
    case "informational":
      return "INFORMATION";
    default:
      return "INFORMATION";
  }
}

export function explainListingRoute(route: string | null | undefined): {
  title: string;
  explanation: string;
} {
  const r = (route ?? "").toUpperCase();
  if (r.includes("EXISTING") || r.includes("OFFER_ON")) {
    return {
      title: "Joining an existing Amazon product page",
      explanation:
        "Amazon already controls the catalogue images and product content. EmpireAI would add our seller offer on that page — we are not creating a new product listing from scratch.",
    };
  }
  if (r.includes("CREATE") || r.includes("NEW")) {
    return {
      title: "Creating a new Amazon listing",
      explanation:
        "Pillow would prepare the customer-facing presentation (images, title, bullets, description) for a new product page.",
    };
  }
  return {
    title: "Listing route not yet confirmed",
    explanation: "Pillow has not yet confirmed whether this joins an existing Amazon page or creates a new one.",
  };
}
