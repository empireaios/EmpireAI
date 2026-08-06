# Production Unblock — Executive Judgement Live Cert

## Status

**UNBLOCKED — 2026-07-24**

Railway production deploy with judgement remediations:

- Deployment ID: `c9b11492-ae17-4c52-994e-ca84628fd2e0`
- Live cert: `node backend/scripts/pillow-executive-judgement-live-cert.mjs`
- Result: **15/15 PASS**
- Evidence: `docs/audits/pillow/executive-judgement/LIVE_CERTIFICATION_EVIDENCE.json`

## Re-run commands

```powershell
cd C:\Users\erlan\OneDrive\Desktop\EmpireAI
curl.exe -sS "https://empireai-production.up.railway.app/health/live"
node backend/scripts/pillow-executive-judgement-live-cert.mjs
```

Vercel redeploy is not required for Brain/Pillow-host judgement remediations (BFF already proxies `/api/pillow/chat`).
