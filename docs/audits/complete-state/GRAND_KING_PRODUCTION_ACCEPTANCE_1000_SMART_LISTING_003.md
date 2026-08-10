# GRAND KING PRODUCTION ACCEPTANCE + 1,000 SMART LISTING LAUNCH 003

Evidence timestamp: 2026-08-10T07:28:00Z  
Production web commit: `2aa419b9` (`dpl_AvCyxsCkhqZZDy5Jv3NFCoUnvbyn`)

## Gate A — Production UX

### Root causes

1. **>2 minute usable load:** `/api/pillow/founder-shell` and `/api/pillow/commerce-operating-model` hung **200–300s** while **30s polls stacked** without abort. Secondary awareness blocked the shell.
2. **Sidebar appeared dead:** sticky sidebar layout boxes drifted under document scroll; hit-testing/automation used wrong coordinates. Fixed rail restores stable targets.
3. **Scroll prisons:** Pillow `88vh` + nested overflow trapped the page.
4. **Machine jargon:** ASIN/SKU/CJ IDs dominated commerce surfaces.

### After (production browser, commit `2aa419b9`)

| Metric | Value |
|--------|-------|
| TTFB | 51 ms |
| DOMContentLoaded | 949 ms |
| Progressive shell | Pillow usable while truth loads |
| Pillow history | ~670 px |
| Composer | 180 px min |
| Sidebar | `position:fixed; z-index:50` |
| Page scroll | top↔bottom works; Pillow does not imprison page |
| Pillow send | Reply: “I am ready as the primary executive workspace for Mission 003 production check.” |
| Centres | All sidebar destinations opened with real headings (no blank/fake LIVE) |
| Approvals | Queue link + governed path only — **no Approve/Reject/publish/spend executed** |

Technical IDs remain under **Technical details / evidence**. Historical chat may still show older ASIN/SKU prompts.

### Gate A verdict

**PRODUCTION ACCEPTANCE READY** (engineering + production verification).  
**Subjective Grand King acceptance is not claimed by Cursor.**

## Gate B — 1,000 SMART viable listings

| Metric | Value |
|--------|-------|
| Target | 1000 |
| Corridor | CJdropshipping × Amazon US |
| Evaluated | 52 |
| Rejected | 42 |
| SMART viable | **6** |
| Distance | **994** |
| Published / BUYABLE / Orders / Realised $ | 0 |
| Latest cycle | SMART_VIABLE_BATCH_COMPLETE (retrieved 8, smart 1) |
| Top rejects | QUALIFICATION_REQUIRED (37), NO_AMAZON_ASIN (5) |

Autonomy: scheduler every 4h + boot tick; page checkpoint/resume + async 202 for SMART batches.  
Principle recorded: `docs/architecture/SUPPLIER_MARKETPLACE_UNIVERSE_PRINCIPLE.md`.

## Residue

Unrelated scratch left uncommitted: `.tmp-*`, EOS evidence JSON churn, `COMMERCE_PROOF_001_*`, pillow typecheck scratch, `empireai-web/app/pillow-shell-preview/`.
