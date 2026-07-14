# EmpireAI Visual Generation Layer & Canva Connect

**Authority:** Grand King · Pillow · Brain · Reality Integration  
**Status:** Production-ready (mock + live OAuth paths)  
**Default Provider:** Canva Connect API

---

## Architecture

Canva is the **canonical default visual production engine** for EmpireAI. It is a **shared platform capability** — not Media-only.

```
Business Engines / Pillow
        ↓
Visual Generation Layer (provider-neutral)
        ↓
Canva Connect Connector (default provider)
        ↓
Canva Connect API
```

**Rule:** Business engines and Pillow must call the **Visual Generation Layer**, never Canva directly.

---

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| Visual Generation Layer | `backend/src/orchestration/visual-generation-layer/` | Provider-neutral visual operations |
| Canva Connect Connector | `backend/src/execution/canva-connect-connector/` | OAuth PKCE, API client, encrypted tokens |

---

## OAuth 2.0 + PKCE Flow

1. `GET /canva/oauth/url?companyId=...` — generates PKCE pair, stores encrypted verifier, returns authorization URL
2. Grand King authorizes in Canva
3. Canva redirects to the canonical production callback:
   **`https://empire-ai.co/api/integrations/canva/callback`**
   (Vercel BFF proxies to Brain `GET /canva/oauth/callback` with `code` + `state`)
4. Alternatively, authenticated clients may call `POST /canva/oauth/exchange` with `code` + `state`
5. Tokens auto-refresh via `resolveCanvaAccessToken()` before API calls

### Redirect URI policy

| Environment | `CANVA_REDIRECT_URI` |
|-------------|----------------------|
| Local dev (Brain only) | `http://localhost:4000/canva/oauth/callback` |
| **Production** | **`https://empire-ai.co/api/integrations/canva/callback`** |

Do **not** use `https://empire-ai.co/canva/oauth/callback` — that route is not implemented.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CANVA_CLIENT_ID` | Live | Canva Connect app client ID |
| `CANVA_CLIENT_SECRET` | Live | Canva Connect app secret |
| `CANVA_REDIRECT_URI` | Yes | OAuth callback URL — production: `https://empire-ai.co/api/integrations/canva/callback` |
| `CREDENTIAL_VAULT_KEY` | Production | AES-256-GCM encryption key for tokens |
| `CANVA_MOCK` | No | `true` for development without live credentials |

---

## Brain Tools

### Visual Generation Layer (use these)
- `visual_generation.create_visual_asset`
- `visual_generation.create_design`
- `visual_generation.export`
- `visual_generation.generate_commerce_creative`
- `visual_generation.generate_marketing_creative`
- `visual_generation.get_health`

### Canva OAuth (admin only)
- `canva.get_oauth_url`
- `canva.exchange_oauth_code`
- `canva.disconnect`
- `canva.get_health`

---

## Registries

- **Reality Integration:** `providerId: canva` (creative_ai)
- **Integrations Hub:** `integrationId: canva`
- **Empire Access Registry:** `platformId: canva`
- **Connection Registry:** `canva` provider with OAuth + refresh support
- **Pillow Intelligence:** `visual_generation` capability routes to VGL

---

## Grand King One-Time Setup

1. Create a Canva Connect app at https://www.canva.dev
2. Set redirect URI to **`https://empire-ai.co/api/integrations/canva/callback`**
3. Set Railway `CANVA_REDIRECT_URI` to the same value
4. Configure `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`, `CREDENTIAL_VAULT_KEY`
5. Deploy backend (Railway) and frontend (Vercel)
6. Open Integrations Hub → Connect Canva → complete OAuth as Grand King

---

## Tests

```bash
node --import tsx --test src/validation/tests/canva-visual-generation.test.ts
```
