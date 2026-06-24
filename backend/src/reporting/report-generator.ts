import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CONNECTOR_CATALOG } from "../connectors/catalog.js";
import { listConnectorMetadata } from "../connectors/metadata.js";
import { costIntelligenceRegistry } from "../cost/cost-registry.js";
import { financialLedger } from "../finance/ledger.js";
import { royaltyFramework } from "../finance/royalty-framework.js";
import { architectureValidator } from "../guardian/architecture-validator.js";
import { productIntelligenceEngine } from "../intelligence/pie-engine.js";
import { PIE_MOCK_EVALUATIONS } from "../intelligence/product-intelligence-engine/mock-samples.js";
import { PRODUCT_INTELLIGENCE_PROVIDER_IDS } from "../intelligence/connectors/index.js";
import { PIE_SAMPLE_PRODUCTS } from "../intelligence/pie-samples.js";
import {
  productScoutEngine,
  SCOUT_MOCK_PRODUCTS,
} from "../intelligence/product-scout/index.js";
import { supplierIntelligenceFramework } from "../intelligence/supplier-intelligence.js";
import { listMockCatalog } from "../intelligence/supplier-intelligence-engine/mock-catalog.js";
import { paymentFramework } from "../payments/payment-framework.js";
import { retentionFramework } from "../retention/retention-framework.js";
import { treasuryEngine } from "../treasury/treasury-engine.js";
import { withdrawalRulesFramework } from "../treasury/withdrawal-rules.js";
import { workforceRegistry } from "../workforce/registry.js";
import { workforceIntelligenceQuery } from "../workforce/intelligence-query.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

export type ReportContext = {
  workspaceId: string;
  repoRoot: string;
  generatedAt: string;
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function listBackendModules(): string[] {
  const src = path.join(repoRoot, "backend", "src");
  if (!fs.existsSync(src)) return [];
  return fs
    .readdirSync(src, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function countFiles(dir: string, ext: string): number {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full, ext);
    else if (entry.name.endsWith(ext)) count += 1;
  }
  return count;
}

export function buildReportContext(workspaceId = "ws_empire_1"): ReportContext {
  return { workspaceId, repoRoot, generatedAt: new Date().toISOString() };
}

export function generateTotalViewReport(ctx: ReportContext): string {
  const modules = listBackendModules();
  const arch = architectureValidator.validate(ctx.workspaceId);
  const workforce = workforceRegistry.orgChart();
  const financial = financialLedger.generateReport(ctx.workspaceId);
  const treasury = treasuryEngine.compute(ctx.workspaceId);

  return `# EMPIREAI TOTAL VIEW REPORT

Generated: ${ctx.generatedAt}
Workspace: ${ctx.workspaceId}

## Executive summary

EmpireAI is an AI Operating System with a Brain orchestration layer, Guardian safety engine, domain persistence, **Mission 006 AI Supplier Intelligence** — supplier discovery, trust scoring, fake detection, and SELL/REVIEW/REJECT recommendations — plus **Mission 005 Product Intelligence Engine** and **Mission 003 AI Product Scout**.

Architecture validation: **${arch.overall}** (${arch.summary})

## System inventory

### Backend modules (${modules.length})

${modules.map((m) => `- \`${m}/\``).join("\n")}

### Platform UI

- \`empireai-web/\` — Next.js 16 primary UI with Brain BFF proxy
- 12 platform modules wired via \`useBrainModule\`

### AI Workforce (${workforce.roles.length} roles)

${workforce.roles.map((r) => `- **${r.title}** (${r.status}) — ${r.module}`).join("\n")}

### Connectors catalogued

${CONNECTOR_CATALOG.length} connectors across ${[...new Set(CONNECTOR_CATALOG.map((c) => c.category))].join(", ")} — ${listConnectorMetadata().length} with full cost/risk metadata

### Intelligence Foundation (Mission 002–006)

| Module | Status | Detail |
|--------|--------|--------|
| Connector metadata registry | Ready | Cost type, API key, risk, fallback per provider |
| Mock providers | Ready | \`EmpireConnector\` with deterministic sample payloads |
| PIE framework scorer | Ready | ${PIE_SAMPLE_PRODUCTS.length} sample products, explainable \`why[]\` |
| **Product Intelligence Engine** | **Ready** | ${PIE_MOCK_EVALUATIONS.length} mock evaluations; Mission 012 adds ${PRODUCT_INTELLIGENCE_PROVIDER_IDS.length} connector sources with catalog/signals persistence; Mission 015 defines Global Product Intelligence architecture |
| **AI Product Scout** | **Ready** | ${SCOUT_MOCK_PRODUCTS.length} mock products; APPROVE/REVIEW/REJECT via Guardian |
| **AI Supplier Intelligence** | **Ready** | ${listMockCatalog().length} mock suppliers; trust scoring, fake detection, SELL/REVIEW/REJECT |
| Legacy supplier framework | Ready | ${supplierIntelligenceFramework.listCatalog().length} verified suppliers scored (Mission 002 compat) |
| Financial ledger | Ready | Append-only; royalty + reserved/withdrawable event types |
| Treasury / withdrawal | Ready | ${withdrawalRulesFramework.listRules().length} withdrawal rules |
| 10% royalty framework | Ready | ${formatCents(royaltyFramework.calculate(ctx.workspaceId).royaltyCents)} calculated |
| Workforce intelligence query | Ready | Role-scoped agent queries to intelligence modules |

## Financial snapshot (ledger-derived)

| Metric | Value |
|--------|-------|
| Revenue (MTD) | ${formatCents(financial.revenueCents)} |
| Expenses | ${formatCents(financial.expensesCents)} |
| Net Profit | ${formatCents(financial.netProfitCents)} |
| EmpireAI Royalty (10%) | ${formatCents(financial.empireaiRoyaltyCents)} |
| Cash Available | ${formatCents(financial.cashAvailableCents)} |
| Safe to Withdraw | ${formatCents(financial.cashSafeToWithdrawCents)} |

## Treasury buckets

| Bucket | Amount |
|--------|--------|
| Available Cash | ${formatCents(treasury.buckets.available_cash)} |
| Reserved Cash | ${formatCents(treasury.buckets.reserved_cash)} |
| Safety Reserve | ${formatCents(treasury.buckets.safety_reserve)} |
| Withdrawable Cash | ${formatCents(treasury.buckets.withdrawable_cash)} |

## Phase status

| Phase | Status |
|-------|--------|
| Brain + Orchestrator | Complete |
| Guardian Engine | Complete |
| Domain layer (SQLite) | Complete |
| Frontend Brain wiring | Complete |
| Phase 3 foundations | Complete |
| Mission 002 Intelligence Foundation | Complete |
| Mission 003 AI Product Scout | Complete |
| Mission 005 Product Intelligence Engine | Complete |
| Mission 006 AI Supplier Intelligence | **Complete (this report)** |
| External connector OAuth | Deferred |
| Production LLM routing | Deferred |
`;
}

export function generateStrengthReport(ctx: ReportContext): string {
  const arch = architectureValidator.validate(ctx.workspaceId);
  const strengths = arch.checks.filter((c) => c.status === "healthy");

  return `# EMPIREAI STRENGTH REPORT

Generated: ${ctx.generatedAt}

## Architectural strengths

${strengths.map((s) => `- **${s.id}**: ${s.message}`).join("\n")}

## Doctrine adherence

- Brain remains single orchestration point
- Append-only financial ledger (no balance overwrites)
- Guardian pre-dispatch safety + health monitoring
- Connector layer uses common \`EmpireConnector\` interface
- Retention framework preserves businesses on cancellation
- Modular repositories with clean boundaries

## Test coverage

- Guardian unit tests
- Brain subsystem integration tests
- Domain layer tests
- Phase 2.5 validation gate (\`npm run validate:full\`)
`;
}

export function generateCostReport(ctx: ReportContext): string {
  const deps = costIntelligenceRegistry.listCatalog();

  return `# EMPIREAI COST REPORT

Generated: ${ctx.generatedAt}

## External dependency cost intelligence

| Dependency | Purpose | Monthly | Business Risk | Technical Risk | Replaceability | Backup |
|------------|---------|---------|---------------|----------------|----------------|--------|
${deps
  .map(
    (d) =>
      `| ${d.dependencyId} | ${d.purpose} | ${formatCents(d.monthlyCostCents)} | ${d.businessRisk} | ${d.technicalRisk} | ${d.replaceability} | ${d.backupProvider ?? "—"} |`,
  )
  .join("\n")}

## Cost implications

- LLM usage is usage-based — largest variable cost at scale
- Redis required for queue/events — operational cost depends on hosting model
- SQLite suitable for early stage; migration cost deferred until scale decision
- Connector integrations may carry per-platform monthly fees (e.g. Shopify)
`;
}

export function generateDependencyReport(ctx: ReportContext): string {
  return `# EMPIREAI DEPENDENCY REPORT

Generated: ${ctx.generatedAt}

## Runtime dependencies

| Dependency | Required | Purpose | Failure mode |
|------------|----------|---------|--------------|
| Redis | Yes | Queue, sessions, events | Integration tests skip; async jobs fail |
| SQLite | Yes | Domain, audit, ledger | Guardian blocks writes on integrity failure |
| LLM API keys | Optional | Agent/workflow execution | Degraded — load tools still work |

## Connector dependencies (prepared, not connected)

${CONNECTOR_CATALOG.map((c) => `- **${c.name}** (${c.category}) → backup: ${c.replaceableBy.join(", ") || "none catalogued"}`).join("\n")}

## Replaceability matrix

All connectors implement \`EmpireConnector\` — swap providers without changing orchestrator routes.
`;
}

export function generateArchitectReport(ctx: ReportContext): string {
  const modules = listBackendModules();
  const tsFiles = countFiles(path.join(repoRoot, "backend", "src"), ".ts");
  const arch = architectureValidator.validate(ctx.workspaceId);
  const retention = retentionFramework.getState(ctx.workspaceId);

  return `# EMPIREAI ARCHITECT REPORT

> Auto-generated by EmpireAI Architect Messenger Bot  
> Generated: ${ctx.generatedAt}

## Current architecture

EmpireAI Brain orchestrates all module actions through \`POST /brain/dispatch\`. Guardian assesses every dispatch. Mission 006 adds **AI Supplier Intelligence** — standalone \`evaluateSupplier()\`, \`compareSuppliers()\`, and \`discoverSuppliers()\` with trust scoring, fake supplier detection, profit margin estimates, and SELL/REVIEW/REJECT recommendations via Brain Contract. Mission 005 adds the **Product Intelligence Engine**. Mission 003 adds **AI Product Scout**.

## Progress

| Area | Progress | Notes |
|------|----------|-------|
| Brain subsystems | 100% | 12 subsystems + Guardian |
| Domain persistence | 80% | SQLite repos; not yet Postgres |
| Frontend integration | 85% | Load + key actions wired |
| Connector layer | 55% | Metadata registry + mock providers; OAuth deferred |
| Financial OS | 60% | Ledger + royalty + withdrawal rules; live events pending |
| PIE framework scorer | 55% | Legacy dimension scorer + sample data; live signals pending |
| **Product Intelligence Engine** | **65%** | Independent scoring + modular recommendations; mock catalog; live signals pending |
| **AI Product Scout** | **60%** | Empire scoring + Guardian gates + Brain dispatch; live catalog pending |
| **AI Supplier Intelligence** | **65%** | Trust scoring + fake detection + Brain Contract; mock catalog; live APIs pending |
| Legacy supplier framework | 50% | Mission 002 compat layer; delegates to engine |
| Workforce intelligence | 45% | Role-scoped query interface; LLM routing pending |
| Deployment | 50% | Docker Compose prepared |

**Backend TypeScript files:** ${tsFiles}  
**Backend modules:** ${modules.join(", ")}

## Architecture validation

Overall: **${arch.overall}**

${arch.checks.map((c) => `- [${c.status}] ${c.id}: ${c.message}`).join("\n")}

## Modules

${modules.map((m) => `- \`${m}\``).join("\n")}

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| SQLite scale limits | Medium | PostgreSQL migration path prepared |
| Redis single point | High | Health checks + graceful degradation |
| LLM cost at scale | High | Cost registry + routing policy needed |
| Connector OAuth complexity | Medium | Stub connectors + common interface |
| Validation not CI-gated | Medium | Run \`validate:full\` in CI |

## Missing capabilities

- Live Shopify/Stripe/Meta OAuth flows
- Workflow hooks updating build stages automatically
- Prometheus metrics export
- Multi-tenant workspace isolation at DB level
- Real-time PIE signal ingestion from Google Trends / GA
- Product Intelligence Engine live connector wiring (Trends, supplier APIs)
- Live supplier API integration (CJ, Spocket, Zendrop OAuth)

## Technical debt

- Some module StatCards still use static trend deltas in Brain metrics
- Legacy \`frontend/\` Vite app unused
- No git repository at project root
- Shell validation not automated in CI

## Retention status

Workspace \`${ctx.workspaceId}\`: **${retention.status}**

## Suggested next mission

**Mission 007: Live Signal & Connector Pilot**

1. Wire Product Intelligence Engine to Google Trends mock → live connector
2. Connect Supplier Intelligence to first live supplier API
3. Bridge PIE evaluations into Product Scout portfolio scans
4. Add workforce intelligence query for cross-module orchestration
5. Add CI validation gate
6. Run end-to-end evaluate → scout → supplier → ledger test

## Business capability

- Company manufacturing framework: **Ready**
- Portfolio dashboard: **Ready**
- Autonomous agent workforce: **Partial** (needs LLM keys)
- Financial traceability: **Framework ready**
- Founder treasury visibility: **Framework ready**

## Financial capability

${(() => {
  const f = financialLedger.generateReport(ctx.workspaceId);
  return `- Ledger events: ${financialLedger.summarize(ctx.workspaceId).eventCount}
- Revenue tracked: ${formatCents(f.revenueCents)}
- Safe withdrawal calc: ${formatCents(f.cashSafeToWithdrawCents)}`;
})()}
`;
}

export function writeAllReports(ctx: ReportContext, outputDir = repoRoot): Record<string, string> {
  const reports: Record<string, string> = {
    "EMPIREAI_TOTAL_VIEW_REPORT.md": generateTotalViewReport(ctx),
    "EMPIREAI_STRENGTH_REPORT.md": generateStrengthReport(ctx),
    "EMPIREAI_COST_REPORT.md": generateCostReport(ctx),
    "EMPIREAI_DEPENDENCY_REPORT.md": generateDependencyReport(ctx),
    "EMPIREAI_ARCHITECT_REPORT.md": generateArchitectReport(ctx),
  };

  for (const [filename, content] of Object.entries(reports)) {
    fs.writeFileSync(path.join(outputDir, filename), content, "utf8");
  }

  return reports;
}
