# CQ-04 — Pillow One-Product Decision Dossier

**Status:** PARTIAL (live dossier verified; Railway redeploy durability still residual)  
**Purpose:** Give Grand King + ChatGPT enough natural-language evidence to challenge Pillow’s commissioning selection.  
**Governance:** Do **not** publish. Do **not** spend. Do **not** complete CQ-05. Cursor does **not** select products.

---

## Canonical product (LIVE)

**Women Vintage Embroidered Floral Tank Vest Y2k Sleeveless V Neck Cardigan Tops Retro Cropped Open Front Street Gilet (A-Black, S)**

| Field | Value | Status |
|------|-------|--------|
| Selection authority | Pillow | Proven |
| Cursor selected | false | Proven |
| Our proposed price | $52.15 | ESTIMATED |
| Lowest competitor | $29.98 | PARTIAL |
| Price difference | +74% / $22.17 | PARTIAL — **prominent risk** |
| Expected profit | $25.86 | ESTIMATED (not realised) |
| Expected margin | 49.59% | ESTIMATED |
| Supplier cost | $9.55 | VERIFIED LIVE |
| Freight | $7.87 | VERIFIED LIVE |
| Amazon fees | $8.87 | VERIFIED LIVE |
| Stock | 7350 | VERIFIED LIVE |
| Demand | UNKNOWN | Honest |
| Pillow recommendation | APPROVE | Awaiting GK |
| Listing route | Offer on existing Amazon page | Amazon owns catalog content |
| Catalog image | Not available from APIs | Honest |

Nordic bedding (Mission 004) = **historical only**. Earlier same-day cart pick was wiped and not Cursor-restored.

---

## Identity reconciliation

| Fact | Truth |
|------|-------|
| Mission 004 Nordic bedding | HISTORICAL ONLY |
| Live commissioning after Railway redeploy | NULL → Pillow reselection required |
| Cursor restore of Nordic / cart | FORBIDDEN / NOT DONE |
| Canonical CQ-04 product | Embroidered Floral Tank Vest (Pillow `one-product/run`) |
| Floating EH commerceOpportunity | May differ (denim jacket shown as separate attention item) |

---

## Surfaces

- **Primary:** Executive Home → `OneProductDecisionDossierPanel` (`#one-product-decision-dossier`)
- **API:** `GET /pillow-commissioning/one-product/decision-dossier`
- **BFF:** `GET /api/pillow-commissioning/one-product/decision-dossier`
- **Persistence:** SQLite `pillow_one_product_decision_dossier` + commissioning row
- **Recovery attempt:** `recoverCommissioningFromFlight` (shipped `37895b14`; did not restore on this wipe)
- **Challenge prep:** Ask/Challenge Pillow seeds CQ-05 questions; CQ-05 remains AWAITING GK+ChatGPT

---

## Non-goals

- No Birth · No 1,000 release · No publish · No spend · No Cursor product choice · No CQ-05 execution
