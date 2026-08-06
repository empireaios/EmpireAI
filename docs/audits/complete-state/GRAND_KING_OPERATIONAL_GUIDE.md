# Grand King Operational Guide — What You Can Do Now

No architecture jargon. Exact surfaces where known.

## Login

- **Open:** `https://empire-ai.co/login`
- **Action:** Enter Grand King email/password → **Enter EmpireAI**
- **Expect:** Executive Home / Cockpit
- **Real data:** Session against production Brain
- **If it fails:** Check Brain health `https://empireai-production.up.railway.app/health/live` — if not `{"status":"ok"}`, wait/redeploy; do not spam refresh (session stampede)

## Executive Cockpit

- **Open:** after login, `/cockpit` (Executive Home)
- **Action:** use left navigation (Mission, Pillow, Commerce, Finance, AI Workforce, etc.)
- **Expect:** pages load; some awareness widgets may show `—` / Retry if a centre has no live feed
- **Changes production?** Navigation alone does not

## Pillow chat

- **Open:** Pillow / Global Assistant shell from Cockpit
- **Action:** type a short instruction; send
- **Expect:** acknowledgement then a real reply (LLM may take several seconds)
- **Real data:** yes, production Pillow session
- **If stuck on “Starting Executive Systems…”:** stop retrying; confirm `/health/live`; wait for admission to clear

## Executive awareness (EESAE)

- **Open:** Empire Awareness / executive surveillance surfaces in Cockpit (labels vary by nav)
- **Expect:** evidence-backed status when Brain healthy; incident history for Brain 502 class documented in audits
- **Limitation:** not a magic crystal ball — depends on injected health/evidence

## Commerce centre

- **Open:** Cockpit → Commerce (`/cockpit/commerce…` routes: workspace, store, marketplace, factory, operating, intelligence)
- **Expect:** dashboards and connectors
- **Caution:** Marketing panels may include **demo** data — do not treat demo numbers as sales

## Supplier search / import

- **UI:** Intelligence → Suppliers (`/cockpit/intelligence/suppliers`) and related supplier panels
- **API (authenticated Brain):** reality-integration live-commerce routes; CJ sync via supplier stack (`cj-api-client.listProducts` / sync service)
- **Today:** credentials present; integration mode defaults **sandbox** until you approve production live commerce
- **Does not change Amazon listings** by itself

## Product recommendation

- **Path:** product discovery / scoring / Q3 commerce workers + commercial intelligence pages
- **Expect:** ranked candidates when engines run with real or sandbox catalogue input
- **Limitation:** treat margin estimates as incomplete until Amazon fees + landed cost confirmed in production mode

## Amazon connection & listing

- **API:**  
  - `GET /amazon-global-seller/readiness`  
  - `GET /amazon-global-seller/capability-profile`  
  - `POST /amazon-global-seller/listing` (creates **local** listing package)  
  - `GET /amazon-global-seller/listings`  
  - `GET /amazon-global-seller/dashboard`
- **UI:** Commerce → Marketplace / Amazon Global Seller related views
- **Live publish:** **not enabled** until Railway `LIVE_COMMERCE_INTEGRATION_MODE=production` (and King approval on package)
- **Approval:** required for publish (`requiresKingApproval: true`)

## Listing monitoring

- After packages exist: `GET /amazon-global-seller/listings` + dashboard
- Live Amazon status only after production publish path is activated

## AI Workforce

- **Open:** AI Workforce centres in Cockpit
- **Expect:** workforce OS / factory views backed by Q runtimes
- **Limitation:** do not confuse workforce UI with live marketplace sales

## Media

- Media factory packs exist; **defer** until first commerce listing path is live unless you have a separate media revenue plan

## Costs / health

- **Brain health:** `/health/live` (includes admission + sqlite flush stats)
- **Providers costing money now:** Railway, Vercel, OpenAI (and any marketplace/supplier subscriptions on your accounts)
- **Action:** prefer activating commerce over adding new infrastructure

## If something fails

1. Check `/health/live`  
2. Avoid rapid session re-creates  
3. Redeploy Railway only if deploy unhealthy  
4. Do not invent new engines — fix the blocked step on the supplier→Amazon path
