/**
 * Machine-readable registry of what Pillow executive chat can actually access.
 *
 * CAPABILITY EXISTS ≠ CAPABILITY WAS USED.
 * Self-description and retrieval claims must be grounded here + attestation ledger.
 */

export type CapabilityAvailability = "available" | "unavailable" | "partial";

export type PillowCapability = {
  id: string;
  label: string;
  category:
    | "runtime_state"
    | "database"
    | "external_comms"
    | "project_mgmt"
    | "market_intel"
    | "deploy"
    | "llm_tools"
    | "documents";
  availability: CapabilityAvailability;
  read: boolean;
  write: boolean;
  mechanism: string;
  evidenceReturned: string;
  limitations: string;
};

/** Static registry for production executive chat (chat tool-calling loop is off). */
export function getPillowCapabilityRegistry(): readonly PillowCapability[] {
  return [
    {
      id: "live_sqlite_commissioning",
      label: "SQLite commissioning / one-product record",
      category: "database",
      availability: "available",
      read: true,
      write: false,
      mechanism: "buildExecutiveTruthSnapshot → getOneProductCommissioningRecord",
      evidenceReturned: "ASIN, productName, stage, selectionAuthority, etc.",
      limitations: "Only durable commissioning row; not arbitrary marketplace APIs",
    },
    {
      id: "live_sqlite_kpi",
      label: "Smart-viable / commerce KPI snapshot",
      category: "runtime_state",
      availability: "available",
      read: true,
      write: false,
      mechanism: "buildSmartViableKpiSnapshot / live commercial situation",
      evidenceReturned: "orders, realisedRevenueUsd, listing counts",
      limitations: "Realised metrics only; does not invent market research",
    },
    {
      id: "birth_record",
      label: "Birth commissioning record",
      category: "runtime_state",
      availability: "available",
      read: true,
      write: false,
      mechanism: "getBirthRecord",
      evidenceReturned: "status, technicallyReady, birthTimestamp, gates",
      limitations: "Birth authorisation is Grand King only",
    },
    {
      id: "railway_deploy_env",
      label: "Railway deploy identity env",
      category: "deploy",
      availability: "available",
      read: true,
      write: false,
      mechanism: "RAILWAY_GIT_COMMIT_SHA / RAILWAY_DEPLOYMENT_ID on process",
      evidenceReturned: "git commit SHA, deployment id when present",
      limitations: "Process env only; not Railway dashboard UI scraping",
    },
    {
      id: "executive_chat_llm",
      label: "LLM completion for executive chat",
      category: "llm_tools",
      availability: "available",
      read: false,
      write: false,
      mechanism: "llmLayer.complete",
      evidenceReturned: "generated text (not external source retrieval)",
      limitations: "Narrative is not provenance",
    },
    {
      id: "chat_tool_calling_loop",
      label: "In-chat tool calling loop",
      category: "llm_tools",
      availability: "unavailable",
      read: false,
      write: false,
      mechanism: "none in production executive chat",
      evidenceReturned: "none",
      limitations: "Pillow cannot claim it invoked tools mid-chat",
    },
    {
      id: "gmail_inbox",
      label: "Gmail / email inbox",
      category: "external_comms",
      availability: "unavailable",
      read: false,
      write: false,
      mechanism: "none wired to executive chat",
      evidenceReturned: "none",
      limitations: "Cannot claim email was reviewed",
    },
    {
      id: "project_management_tool",
      label: "Project management tool / dashboard",
      category: "project_mgmt",
      availability: "unavailable",
      read: false,
      write: false,
      mechanism: "none wired to executive chat",
      evidenceReturned: "none",
      limitations: "Cannot claim PM tool access",
    },
    {
      id: "supplier_comms_channel",
      label: "Supplier communications channel",
      category: "external_comms",
      availability: "unavailable",
      read: false,
      write: false,
      mechanism: "none wired to executive chat",
      evidenceReturned: "none",
      limitations: "Cannot claim supplier email/chat review",
    },
    {
      id: "meeting_notes_repository",
      label: "Meeting notes repository",
      category: "documents",
      availability: "unavailable",
      read: false,
      write: false,
      mechanism: "none wired to executive chat",
      evidenceReturned: "none",
      limitations: "Cannot claim meeting participation/review",
    },
    {
      id: "internal_audit_system",
      label: "Internal audit system / operational audits store",
      category: "documents",
      availability: "unavailable",
      read: false,
      write: false,
      mechanism: "none wired to executive chat as a browsable audit store",
      evidenceReturned: "none",
      limitations: "Live truth snapshot is not an audit-report browser",
    },
    {
      id: "market_analysis_tool",
      label: "Market analysis / competitive research tool",
      category: "market_intel",
      availability: "unavailable",
      read: false,
      write: false,
      mechanism: "none wired to executive chat",
      evidenceReturned: "none",
      limitations: "Cannot invent market analysis reports",
    },
  ];
}

export function formatCapabilityRegistryBrief(): string {
  const regs = getPillowCapabilityRegistry();
  const lines = [
    "--- Pillow capability registry (CURRENT — exists ≠ used) ---",
    "You may ONLY claim personal retrieval/access for capabilities marked available AND attested as used in this turn.",
    "Unavailable capabilities must remain UNKNOWN — never invent system names to fill gaps.",
    "",
  ];
  for (const c of regs) {
    lines.push(
      `- ${c.id}: availability=${c.availability}; read=${c.read}; mechanism=${c.mechanism}; limit=${c.limitations}`,
    );
  }
  return lines.join("\n");
}

export function isCapabilityAvailable(id: string): boolean {
  return getPillowCapabilityRegistry().some(
    (c) => c.id === id && c.availability === "available" && c.read,
  );
}
