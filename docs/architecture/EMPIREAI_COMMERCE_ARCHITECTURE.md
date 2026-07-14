# EMPIREAI COMMERCE ARCHITECTURE

> **Classification:** CANONICAL — Tier 5 Normative Architecture (Commerce)  
> **Document ID:** P3-05  
> **Constitutional phase:** P3 — Architecture Foundation  
> **Dependencies:** P1 complete · P2 complete · P3-01 → P3-04 · CTD · CBD · Architecture Law  
> **Owner:** Pillow (stewardship) · Grand King (irreversible commercial authority)  
> **Authority:** CANONICAL — single permanent Commerce architecture; **subordinate to CTD · CBD · Pillow Constitution · Architecture Law**  
> **Parent:** [`EMPIREAI_ARCHITECTURE_LAW.md`](./EMPIREAI_ARCHITECTURE_LAW.md) · [`EMPIREAI_CANONICAL_ARCHITECTURE.md`](./EMPIREAI_CANONICAL_ARCHITECTURE.md) §3.6 · §3.7  
> **Ratified:** 2026-07-05 (P3-05)  
> **Role:** Permanent architecture of the constitutional business operating layer — reconstructed from repository, not a rewrite

**Commercial law:** [`EMPIREAI_CORE_CONSTITUTION_CTD.md`](../../EMPIREAI_CORE_CONSTITUTION_CTD.md) · [`EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md`](../../EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md)  
**Lifecycle companion (C001):** [`EMPIREAI_COMMERCE_CANON.md`](../../EMPIREAI_COMMERCE_CANON.md) — stage machine · journeys · module map  
**Kernel companion (COS-001):** [`COMMERCE_OS_BLUEPRINT.md`](../../COMMERCE_OS_BLUEPRINT.md) — domain kernels · objects · adapters  
**Integration fabric (G2-00):** [`artifacts/g2-infrastructure-commerce-architecture.md`](../../artifacts/g2-infrastructure-commerce-architecture.md) — connector · marketplace · supplier fabric  
**Risk governance:** [`COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md`](../governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md) · ADR-051  
**Runtime evidence:** [`docs/audits/full-empireai-audit/11_BUSINESS_AND_COMMERCE_AUDIT.md`](../audits/full-empireai-audit/11_BUSINESS_AND_COMMERCE_AUDIT.md) (EVIDENCE)

---

## 1. Purpose

**Commerce** is the **constitutional business execution layer** of EmpireAI — not merely dropshipping, not a storefront plugin, not Cockpit UI. Commerce **manufactures, operates, monitors, and continuously improves businesses** under constitutional governance.

| Commerce IS | Commerce IS NOT |
|-------------|-----------------|
| Business operating layer — factory → launch → operation → growth | Vision, Soul, or Constitution author |
| End-to-end venture lifecycle orchestrator (via Brain) | Pillow intelligence or Builder implementation channel |
| Product · supplier · marketplace · marketing · revenue domain | Production Truth owner |
| Intelligence consumer and execution coordinator | Cockpit presentation layer |
| Grand King-first commercial authority model | Autonomous profit engine without approval |

**Canonical name:** **Commerce** (ECNS-2) — the commercial execution domain governed by Commerce Canon (C001) and expressed through Business Engines, Executive AI Engines, and G2 integration fabric under Pillow stewardship.

**The principle:** Pillow governs · Brain executes · Intelligence informs · Commerce operates · Cockpit visualizes · Grand King approves irreversibles.

---

## 2. Constitutional Relationships

```
Grand King (sovereign · flagship account · irreversible commercial authority)
        ↓
Vision · Soul · CTD · CBD (WHY · commercial law — Commerce never amends)
        ↓
Pillow (stewards Commerce · credentials · live-commerce approval · CRI)
        ↓
Commerce (this document — business operating layer)
        ↓
Executive AI Engines (G3 — discover · score · recommend)
        ↓
Brain (mandatory dispatch — tools · agents · workflows)
        ↓
Business Engines + G2 Fabric (domain execution · external connections)
        ↓
Production Truth (acceptance · live mode gates)
        ↓
Cockpit (visualizes status · KPIs · approvals — never executes commerce)
```

| System | Relationship |
|--------|--------------|
| **Vision · Soul · CTD** | Commerce synchronizes at mission start; commercial actions bounded by CTD-001→040 |
| **CBD · Commerce Canon · CRI** | Hard commercial bounds — lifecycle, approval chain, CRIR gates |
| **Pillow** | Owns stewardship, credentials policy, live-commerce approval, commerce intelligence |
| **Brain** | Mandatory execution path — every commerce tool routes through dispatch |
| **Executive AI Engines (G3)** | Intelligence feeds Commerce decisions — Commerce does not duplicate scoring |
| **G2 Infrastructure & Commerce** | Integration fabric — connects · activates · routes · monitors |
| **Business Engines** | Domain execution — manufacture · publish · fulfill · charge · report |
| **Cockpit** | Commerce department panels · Executive Home widgets — display only |
| **Builder** | Implements Commerce architecture changes under Pillow supervision |
| **Guardian · empire-governance** | Pre-dispatch safety on external-facing commerce actions |

---

## 3. Ownership & Stewardship

| Field | Definition |
|-------|------------|
| **Constitutional steward** | Pillow |
| **Irreversible commercial authority** | Grand King |
| **Normative architecture maintainer** | Chief Architect · Commercial Architecture |
| **Lifecycle SSOT** | Commerce Canon (C001) — companion, not competing |
| **Kernel SSOT** | Commerce OS Blueprint (COS-001) — companion, not competing |
| **Integration programme** | G2-00 Infrastructure & Commerce — companion, not competing |
| **Primary runtime** | `backend/src/orchestration/` · `backend/src/intelligence/` · `backend/src/execution/` · `backend/src/revenue/` |
| **Registry catalog** | REG-* rows via RegistryLoader — countries · channels · marketplaces · suppliers |
| **Cockpit surfacing** | Commerce department · `CommerceEnginePanels.tsx` · panel views service |
| **Pillow commerce intelligence** | `pillow/src/commerce-intelligence/` · Empire Operating System |

**Rule:** One Commerce architecture (this document). C001 maps lifecycle; COS defines kernels; G2 defines fabric. No fourth competing commerce architecture.

---

## 4. Responsibilities

Commerce **owns the business operating concern** — not the platform layers:

| Responsibility | Primary runtime / doc |
|----------------|----------------------|
| Business creation | Business Factory pipeline (§5) · `business-build-engine/` · `ecommerce-os-orchestrator/` |
| Business operation | Order pipeline · fulfillment · customer lifecycle |
| Product intelligence | G3 PIE · product discovery · scoring |
| Supplier management | G3 SIE · CJ connector · supplier health |
| Marketplace integration | G2 marketplace fabric · `marketplace-connection-engine/` |
| Inventory orchestration | Supplier sync · catalog publishing |
| Order orchestration | `customer-order-pipeline/` · `live-payment-engine/` |
| Customer lifecycle | Customer intelligence · retention · CS kernels |
| Marketing orchestration | Meta ads · campaign packages · advertising intelligence |
| Revenue reporting | `grand-kings-revenue-engine/` · ledger · OFD |
| Profit reporting | Financial intelligence · margin analysis |
| Business analytics | Analytics fabric · Eye series · KPI engines |
| Business automation | G5 Business Automation — orchestrates approved commerce ops |
| Continuous optimisation | OFD learning · optimization packages · scaling |

---

## 5. Commerce Domains

Fourteen constitutional domains map to repository modules and COS kernels:

| Domain | Purpose | Primary evidence |
|--------|---------|------------------|
| **Business Factory** | Idea → replicated business pipeline | §6 · `ecommerce-os-orchestrator/` |
| **Brand Management** | Identity · narrative · visual system | `business-preview-studio/` |
| **Store Management** | Storefront deploy · domain · checkout UX | `production-store-deployment/` · storefront fabric |
| **Product Catalogue** | Workspace catalog · listings · variants | `product-publishing-engine/` · REG-PRODUCT |
| **Product Intelligence** | Winning product discovery · scoring | §7 · `product-intelligence-engine/` |
| **Supplier Intelligence** | Qualification · health · risk | §8 · `supplier-intelligence-engine/` |
| **Marketplace Intelligence** | Channel policy · fees · constraints | G3 market intel · CRI feeds |
| **Customer Intelligence** | Segments · LTV · retention signals | G3 customer intel · Eye |
| **Marketing Intelligence** | Campaign performance · audience | G3 advertising intel |
| **Financial Intelligence** | Margin · cash flow · exposure | G3 financial intel · Blake agent |
| **Advertising Intelligence** | ROAS · budget · scaling signals | `meta-ads-connector/` · Taylor agent |
| **Automation Engine** | G5 workflow orchestration into commerce | Business Automation programme |
| **Business Analytics** | KPI · executive reporting | Analytics fabric · Cockpit KPIs |
| **Commerce Readiness** | CRIR · launch gates | `commerce-readiness-engine/` |

---

## 6. Business Factory

The **Business Factory** is Commerce's constitutional manufacturing pipeline — every venture follows **one path**:

```
Idea
  ↓
Business Blueprint
  ↓
Brand
  ↓
Store
  ↓
Products
  ↓
Suppliers
  ↓
Marketing
  ↓
Launch
  ↓
Operation
  ↓
Growth
  ↓
Optimisation
  ↓
Replication
```

### 6.1 Stage mapping (C001 alignment)

| Factory stage | Commerce Canon phase | Responsible modules |
|---------------|---------------------|---------------------|
| **Idea** | IDEA | `product-discovery-opportunity-engine`, `ecommerce-os-orchestrator` |
| **Business Blueprint** | DISCOVERY · EVALUATION | `business-opportunity-workspace`, `market-domination-strategy-engine` |
| **Brand** | BRANDING | `business-preview-studio` |
| **Store** | BUILD · PUBLICATION (prep) | `business-build-engine`, `production-store-deployment` |
| **Products** | BUILD · PUBLICATION | `product-publishing-engine`, `execution-layer` |
| **Suppliers** | READINESS | `reality-integration`, CJ connector, SIE |
| **Marketing** | MARKETING | `meta-ads-connector`, marketing packages |
| **Launch** | READINESS → PUBLICATION → LIVE | `commerce-readiness-engine`, CRIR gate |
| **Operation** | ORDER · FULFILLMENT · CUSTOMER | `live-payment-engine`, `live-cj-fulfillment`, order pipeline |
| **Growth** | SCALING | `operation-first-dollar`, `ecommerce-os-orchestrator` |
| **Optimisation** | OPTIMIZATION · RETENTION | Eye series, optimization packages |
| **Replication** | New IDEA with soul-memory lessons | EOS · soul-runtime · portfolio expansion |

### 6.2 Factory gates

| Gate | Requirement | Blocker if missing |
|------|-------------|-------------------|
| Human approval | Founder/Grand King approve opportunity + preview | Cannot enter BUILD |
| Build-only protection | `publishBlocked` until Project Reality | Cannot live-publish |
| Commerce readiness | Connectors CONNECTED · credentials bound | `NOT_READY` |
| CRIR certification | Governance + Finance sign-off · survivability | Cannot LAUNCH |
| Live mode flags | `LIVE_PAYMENT_ENABLED`, fulfillment flags, Meta OAuth | Mock-only operation |
| Grand King live gate | Irreversible publish · payout · production storefront | Blocked pending approval |

---

## 7. Product Intelligence Architecture

Product Intelligence answers **what to sell, at what price, with what margin, from whom**.

| Capability | Definition | Runtime |
|------------|------------|---------|
| **Winning Product Discovery** | Rank opportunities from market + supplier signals | `product-discovery-opportunity-engine/` |
| **Trend Analysis** | Category and demand trend ingestion | Eye · market connectors |
| **Demand Analysis** | Search volume · seasonality · geo demand | G3 market intelligence |
| **Competition Analysis** | Competitor pricing · offer density | PIE · marketplace intel |
| **Pricing** | Recommended price bands · MAP compliance | PIE scoring · financial intel |
| **Margin Analysis** | Landed cost · fee stack · net margin | SIE + financial intel + CRI |
| **Supplier Selection** | Match product to qualified supplier | SIE · supplier-network agent (Alex) |
| **Product Scoring** | Unified PIE score — single pipeline | `product-intelligence-engine/` |
| **Product Lifecycle** | DISCOVERING → LIVE → OPTIMIZATION → ARCHIVE | Commerce Canon state machine |

**Rule:** One scoring pipeline (PIE). Runtime `live-product-intelligence` **consumes** PIE — does not duplicate it (Canonical Architecture §3.7).

**Agents:** Morgan (product-intelligence) · Jordan (product-scout) · Quinn (supplier-intelligence).

---

## 8. Supplier Architecture

Supplier architecture governs **who fulfills, at what reliability, with what risk**.

| Capability | Definition | Runtime |
|------------|------------|---------|
| **Supplier Discovery** | Catalog browse · network expansion | `suppliers/cj-dropshipping/` · global-commerce |
| **Supplier Qualification** | Capability · policy · region fit | SIE · CRIR section 1 |
| **Supplier Health** | API uptime · catalog freshness | G2 supplier fabric · connector health |
| **Supplier Performance** | SLA · defect rate · ship time | EKLS operational memory |
| **Supplier Reliability** | Fill rate · tracking accuracy | Order pipeline metrics |
| **Supplier Replacement** | Failover · alternate SKU mapping | Supplier risk playbook · CRI |
| **Supplier Risk** | Refund/dispute exposure · survivability | CRI Doctrine · CRIR |
| **Global Supplier Strategy** | Multi-region · diversification | Registry REG-SUPPLIER · deployment profile |

**Primary connector (V1):** CJ Dropshipping — `live-cj-fulfillment/` · b6 evidence.  
**Governance:** Irreversible supplier submit requires Founder approval · Guardian pre-dispatch.

---

## 9. Marketplace Architecture

Marketplace architecture ensures **channel independence** — EmpireAI operates businesses across platforms without hardcoded platform logic in core.

### 9.1 Supported and planned channels

| Channel | Status | Evidence |
|---------|--------|----------|
| **Shopify** | Planned / partial stubs | COS Marketplace Kernel · storefront fabric |
| **Amazon** | Built (SP-API) | `eye/connectors/amazon/` · b6-01a evidence |
| **TikTok Shop** | Planned | COS capability matrix · REG-CHANNEL |
| **Meta Commerce** | Partial (ads + shops roadmap) | `meta-ads-connector/` |
| **Future marketplaces** | Registry-first | REG-MARKETPLACE catalog rows · EPF plugins |

### 9.2 Marketplace independence tenets

| # | Tenet | Implication |
|---|-------|-------------|
| MP-1 | **Registry-first channels** | REG-CHANNEL resolves operational identity — no `if amazon-us` in core |
| MP-2 | **Abstraction layer** | G2 Marketplace Fabric + `IMarketplaceAdapter` (COS Connector SDK) |
| MP-3 | **Separation of catalog and execution** | REG-PRODUCT (workspace) ≠ REG-MARKETPLACE (platform listing) |
| MP-4 | **Readiness before live** | Connector health + CRIR + Guardian before first publish |
| MP-5 | **Marketplace autonomy (REAL-051A)** | Post-onboarding autonomous publish/sync/route — subject to CBD-018 approval chain |

**Runtime:** `marketplace-connection-engine/` · `infrastructure-commerce/` · `reality-integration/live-commerce/`.

---

## 10. Marketing Architecture

Marketing orchestrates **campaigns from package to live spend to ROI recovery**.

| Capability | Definition | Runtime |
|------------|------------|---------|
| **Campaigns** | Campaign lifecycle DRAFT → ACTIVE → PAUSED | `meta-ads-connector/` · marketing packages |
| **Creative Generation** | Asset packages · ad copy | `execution-layer` · Riley agent |
| **Audience Selection** | Targeting · lookalike · retarget | Advertising intelligence |
| **Budget Management** | Daily/lifetime caps · pacing | Meta API · Taylor agent (L3) |
| **Performance Tracking** | Spend · impressions · conversions | Analytics fabric · Eye |
| **Scaling** | ROAS-triggered budget increase | G5 automation · founder approval L3+ |
| **Pause** | Kill switch · campaign pause | Cockpit action → Brain dispatch |
| **Recovery** | Underperforming campaign remediation | Optimization packages · OFD learning |
| **ROI Analysis** | ROAS · MER · contribution margin | Financial + advertising intelligence |

**Governance:** Live ad spend requires OAuth + Founder approve + launch · `MetaAdsBlockedError` when gated.

---

## 11. Financial Architecture

Financial architecture tracks **revenue truth from first visitor to net profit**.

| Capability | Definition | Runtime |
|------------|------------|---------|
| **Revenue** | Gross sales · order value | `live-payment-engine/` · ledger |
| **Costs** | COGS · platform fees · shipping | Order pipeline · SIE margin |
| **Advertising** | Ad spend attribution | Meta spend records · analytics |
| **Profit** | Net margin · contribution | Financial intelligence · Blake agent |
| **Cash Flow** | Payout timing · reserve exposure | Stripe · treasury |
| **Business Health** | Composite score · survivability | CRI · commerce readiness |
| **KPI** | OFD milestones · first dollar · scaling | `operation-first-dollar/` · OFD phases |
| **Executive Reporting** | Cockpit Finance department · Grand King dashboards | panel-views · revenue engine |

**Revenue loop (canonical path):** payment → pipeline → fulfillment → ledger → KPI update (Canonical Architecture §3.6).

**Rule:** REAL vs SIMULATED — OFD milestones after first visitor require `externalReference`; metrics labeled by source (C001 §1.2).

---

## 12. Grand King Model

Commerce architecture is **Grand King-first** with a deliberate expansion path:

```
One Grand King Account (co-grand-king · flagship)
        ↓
Validated (CRIR · readiness · proofs)
        ↓
Optimised (OFD learning · intelligence feedback)
        ↓
Repeatable (Business Factory replication · soul-memory)
        ↓
Future Multi-Founder Expansion (workspace-scoped portfolio)
```

| Field | Definition |
|-------|------------|
| **Flagship account** | `co-grand-king` — Operation First Dollar authority |
| **Founder accounts** | Portfolio companies scoped by `workspaceId` / `companyId` |
| **Authority parity** | Same module stack · scoped isolation · Pillow credentials per workspace |
| **Irreversibles** | Grand King (or delegated Founder) for live publish · payout · production deploy |
| **Expansion rule** | Multi-founder is **workspace isolation + registry rows** — not a fork of Commerce architecture |

**Runtime:** `grand-king-commerce-operations/` · `grand-kings-revenue-engine/` · `operation-first-dollar/`.

---

## 13. Interfaces

### 13.1 Pillow

| Interface | Direction | Contract |
|-----------|-----------|----------|
| Commerce intelligence | Pillow → Grand King | Recommendations · readiness summaries |
| Credential policy | Pillow governs | OAuth · API keys · live-commerce activation |
| Live-commerce approval | Pillow gates | Irreversible external mutations |
| CRI stewardship | Pillow owns | CRIR certification path |
| EOS integration | Pillow package | `empire-operating-system/` |

### 13.2 Brain

| Interface | Pattern | Rule |
|-----------|---------|------|
| Tool dispatch | `module:action` | Mandatory — no direct frontend→provider |
| Agent binding | 12 commerce-related agents | Victoria · Morgan · Jordan · Alex · Quinn · Casey · Riley · Taylor · Blake · Sam · Nova |
| Guardian | Pre-dispatch | External-facing steps |
| Audit | Post-dispatch | EKLS + audit log |

### 13.3 Cockpit

| Surface | Content | Rule |
|---------|---------|------|
| Commerce department | Engine panels · readiness · orders | Display + approval queue only |
| Executive Home | Commerce widgets (lite in prod) | No embedded commerce execution |
| Integrations UI | Connector health · credential status | Actions route to Brain |

### 13.4 Builder

Builder implements Commerce architecture changes — module additions, connector adapters, documentation — under Pillow supervision. Builder never approves live commerce.

### 13.5 G2 · G3 · G5 boundaries

| Layer | Commerce role |
|-------|---------------|
| **G3 Executive AI** | Discover · score · recommend — **never executes** |
| **G2 Infrastructure** | Connect · route · monitor — **never scores** |
| **G5 Automation** | Orchestrate approved workflows — **never owns domain logic** |
| **Business Engines** | Domain execution — publish · charge · fulfill |

---

## 14. Governance

| Policy | Source | Commerce enforcement |
|--------|--------|---------------------|
| One lifecycle | C001 §1.2 | All modules align to canonical phases |
| Build-only until ready | C001 · Project Reality | `publishBlocked` flags |
| Human approval gates | C001 · CBD-018 | Triple approval chain |
| CRIR before launch | CRI Doctrine · ADR-051 | `commerce-readiness-engine/` |
| Survival over profit | CRI-003 | Refund/dispute survivability FAIL blocks launch |
| Guardian first | Engineering Constitution | Pre-dispatch on external ops |
| Sandbox forbidden in prod | Canonical Architecture §3.6 | `*_sandbox_only`, `mock=1` blocked |
| Marketplace autonomy | REAL-051A | Post-onboarding execution within approval chain |
| Production Truth | P1-10 | Live mode requires acceptance evidence |

---

## 15. Evolution

| Change type | Authority | Update path |
|-------------|-----------|-------------|
| New marketplace/supplier | Registry + EPF + G2 mission | REG-* row · adapter plugin · no core fork |
| New Business Engine | Chief Architect + ADR | Canonical Architecture §3.6 mapping |
| Lifecycle stage change | Grand King + C001 amendment | Commerce Canon first · then this doc §6 |
| New intelligence engine | G3 programme | Canonical Architecture §3.7 |
| Commerce namespace consolidation | REAL mission | Scattered folders → `commerce/` tree (§3.6 target) |
| Runtime CRIR enforcement | Future REAL | `commerce-readiness-engine` + Cockpit Governance |

**Consolidation target (Canonical Architecture §3.6):**

```
commerce/
├── manufacture/   ← autonomous-company-manufacturing-loop
├── storefront/    ← store-* · project-materialization
├── deploy/        ← production-store-deployment
├── payments/      ← live-payment-engine
├── orders/        ← customer-order-pipeline
├── fulfillment/   ← live-cj-fulfillment
├── revenue/       ← minimum-live-revenue-loop · grand-kings-revenue-engine
├── grand-king/    ← grand-king-* pipelines
├── ads/           ← meta-ads-connector
└── publishing/    ← product-publishing-engine
```

---

## 16. Examples

### Example 1 — Business Factory (constitutional path)

Grand King approves product opportunity → Business Build assembles package (`publishBlocked: true`) → CRIR certified → readiness `READY_TO_LAUNCH` → Grand King approves production deploy → store LIVE → first Stripe payment → CJ fulfillment → OFD first-dollar milestone → soul-memory captured.

### Example 2 — Product Intelligence flow

Jordan (product-scout) dispatches discovery → PIE scores opportunities → Morgan recommends top 3 → Grand King approves → Alex (supplier-network) validates CJ mapping → build proceeds.

### Example 3 — Marketplace independence

New TikTok Shop channel added via REG-CHANNEL row + EPF adapter — G2 fabric routes publish; Business Engine owns listing semantics; no Commerce core code change.

### Example 4 — Violation (forbidden)

Frontend calls Stripe API directly → violates Brain-only execution · Engineering Constitution · Commerce §13.2.

### Example 5 — CRI gate

Launch blocked: CRIR survivability FAIL — refund rate × dispute fee exposure exceeds margin floor → Governance returns `NOT_CERTIFIED` → Commerce readiness `BLOCKING`.

---

## 17. Validation Checklist (P3-05)

| Check | Status |
|-------|--------|
| Aligns with Vision · Soul · CTD · CBD | §1 · §2 · §14 |
| Aligns with Constitution Hierarchy · Engineering Constitution | §2 · §13.2 |
| Aligns with Architecture Law · Documentation Law | Header · companions |
| Aligns with Canonical Architecture §3.6 · §3.7 · §3.7A | §3 · §5 · §14 |
| Aligns with Brain · Pillow · Cockpit · Builder Architecture | §2 · §13 |
| No duplicated Commerce authority | §3 · C001/COS/G2 as companions |
| Commerce domains validated | §5 |
| Business Factory validated | §6 |
| Supplier architecture validated | §8 |
| Marketplace architecture validated | §9 |
| Marketing architecture validated | §10 |
| Financial architecture validated | §11 |
| Cross-references completed | §18 Related |

---

## 18. Ratification

| Field | Value |
|-------|-------|
| **Mission** | P3-05 — Commerce Architecture |
| **Ratification date** | 2026-07-05 |
| **Next architecture mission** | Phase P3 complete — P4-01 Engineering Standards |

---

## Revision History

| Version | Date | Authority | Change |
|---------|------|-----------|--------|
| 1.0.0 | 2026-07-05 | Grand King · P3-05 | Canonical Commerce Architecture — business operating layer |

---

## Related

- [`EMPIREAI_COMMERCE_CANON.md`](../../EMPIREAI_COMMERCE_CANON.md) (C001 lifecycle) · [`COMMERCE_OS_BLUEPRINT.md`](../../COMMERCE_OS_BLUEPRINT.md) (COS-001 kernels)  
- [`EMPIREAI_PILLOW_ARCHITECTURE.md`](./EMPIREAI_PILLOW_ARCHITECTURE.md) · [`EMPIREAI_BRAIN_ARCHITECTURE.md`](./EMPIREAI_BRAIN_ARCHITECTURE.md) · [`EMPIREAI_COCKPIT_ARCHITECTURE.md`](./EMPIREAI_COCKPIT_ARCHITECTURE.md) · [`EMPIREAI_BUILDER_ARCHITECTURE.md`](./EMPIREAI_BUILDER_ARCHITECTURE.md) · [`EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md`](./EMPIREAI_INFRASTRUCTURE_ARCHITECTURE.md)  
- [`EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md`](../../EMPIREAI_COMMERCIAL_BUSINESS_DOCTRINE_CBD.md) · [`COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md`](../governance/COMMERCIAL_RISK_INTELLIGENCE_DOCTRINE.md)  
- [`artifacts/g2-infrastructure-commerce-architecture.md`](../../artifacts/g2-infrastructure-commerce-architecture.md) · [`backend/src/orchestration/commerce-readiness-engine/`](../../backend/src/orchestration/commerce-readiness-engine/) · [`EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md`](../governance/EMPIREAI_ARCHITECTURAL_DECISION_RECORD_SYSTEM.md) (P3-07)
