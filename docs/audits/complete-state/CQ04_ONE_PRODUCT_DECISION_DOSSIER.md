# CQ-04 — Pillow One-Product Decision Dossier

**Status:** PARTIAL → implementing live dossier (see evidence JSON for final verdict)  
**Purpose:** Give Grand King + ChatGPT enough natural-language evidence to challenge Pillow’s commissioning selection.  
**Governance:** Do **not** publish. Do **not** spend. Do **not** complete CQ-05. Cursor does **not** select products.

---

## Identity reconciliation (required)

| Fact | Truth |
|------|-------|
| Mission 004 Nordic bedding | **HISTORICAL ONLY** — expected profit $90.24 recorded in Mission 004 evidence |
| Live commissioning ledger before CQ-04 run | **NULL** (durability loss on Railway SQLite) |
| Cursor restore of Nordic | **FORBIDDEN / NOT DONE** |
| Pillow reselection | Via `POST /pillow-commissioning/one-product/run` from production opportunities |
| Canonical CQ-04 product | **Whatever Pillow selected at reselection** (see live dossier / evidence) |
| Floating EH commerceOpportunity | May **differ** from commissioning — shown separately under progressive disclosure |

---

## Surfaces

- **Primary:** Executive Home → `OneProductDecisionDossierPanel` (`#one-product-decision-dossier`)
- **API:** `GET /pillow-commissioning/one-product/decision-dossier`
- **Persistence:** SQLite `pillow_one_product_decision_dossier` keyed by workspace
- **Challenge prep:** Ask/Challenge Pillow buttons seed CQ-05 questions; CQ-05 remains AWAITING GK+ChatGPT

---

## Non-goals

- No Birth · No 1,000 release · No publish · No spend · No Cursor product choice · No CQ-05 execution
