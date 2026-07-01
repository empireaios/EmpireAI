export const GOVERNANCE_AUDIT_ITEMS = [
  { id: "au1", area: "Commerce launch gates", finding: "Demo mode — live governance not wired", severity: "info", status: "open" },
  { id: "au2", area: "Payment connector", finding: "Stripe disconnected in demo", severity: "warning", status: "open" },
  { id: "au3", area: "V1 certification", finding: "82% readiness — blockers remain", severity: "medium", status: "tracking" },
];

export const GOVERNANCE_POLICIES = [
  { id: "pol1", name: "Grand King approval required for live publish", scope: "Commerce", status: "active" },
  { id: "pol2", name: "No auto-execute on Soul recommendations", scope: "Governance", status: "active" },
  { id: "pol3", name: "Sandbox-only order submit until LIVE_PAYMENT", scope: "Operations", status: "active" },
];

export const GOVERNANCE_RISKS = [
  { id: "rk1", risk: "Unconfigured Brain API in production", impact: "high", likelihood: "medium", mitigation: "Configure BRAIN_API_URL" },
  { id: "rk2", risk: "Dual frontend surfaces", impact: "medium", likelihood: "high", mitigation: "REAL-124+ consolidation" },
  { id: "rk3", risk: "Mock fulfillment in orders panel", impact: "medium", likelihood: "high", mitigation: "REAL-127+ live path" },
];

export const GOVERNANCE_RECOVERY_PLANS = [
  { id: "rec1", scenario: "Brain API outage", rto: "15 min", status: "documented", owner: "Infrastructure" },
  { id: "rec2", scenario: "Failed deployment rollback", rto: "5 min", status: "documented", owner: "Development" },
  { id: "rec3", scenario: "Payment webhook failure", rto: "30 min", status: "draft", owner: "Operations" },
];

export const DEVELOPMENT_PILLOW_SESSIONS = [
  { id: "pillow1", title: "REAL-092 programme kickoff", status: "complete", updated: "Today" },
  { id: "pillow2", title: "Commerce G3 implementation", status: "in_progress", updated: "Today" },
];

export const DEVELOPMENT_APPROVALS = [
  { id: "ap1", title: "Nova Home launch gate", type: "Launch", status: "pending" },
  { id: "ap2", title: "Meta budget increase", type: "Ads", status: "pending" },
];

export const DEVELOPMENT_INSPECTION = [
  { id: "es1", module: "Commerce Store", compliance: "92%", status: "pass" },
  { id: "es2", module: "Operations Orders", compliance: "78%", status: "caution" },
];

export const DEVELOPMENT_LEARNING = [
  { id: "lr1", topic: "Cockpit department shell pattern", status: "complete", score: "A" },
  { id: "lr2", topic: "Demo vs live data mode separation", status: "in_progress", score: "—" },
];
