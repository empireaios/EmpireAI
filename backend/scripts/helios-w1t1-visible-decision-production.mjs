/**
 * Production-equivalent Helios W1-T1 visible decision authority check.
 * Uses cockpit chat path. Does not award Wave credit.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/capability-extraction");
const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";

try {
  for (const line of readFileSync(path.join(ROOT, "backend/.env"), "utf8").split(/\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }
} catch {}

const EMAIL = process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL;
const PASSWORD = process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Missing credentials");
  process.exit(2);
}

const HELIOS = `W1-T1 — Helios supplier decision

Helios must choose one supplier now.

A supplier is currently eligible only if:
* contribution ≥ US$10/order
* stock ≥ 1,000 units
* delivery ≤ 6 days
* approval = granted

Among currently eligible suppliers, choose the supplier with the highest contribution.

Supplier Ember:
* contribution: US$12.50/order
* stock: 1,250
* delivery: 5 days
* approval: granted

Supplier Flint:
* contribution: US$15.80/order
* stock: 1,600
* delivery: 8 days
* approval: granted

Supplier Grove:
* contribution: US$17.20/order
* stock: 1,450
* delivery: 4 days
* approval: pending

Required answer:
1. Complete current eligible set.
2. Supplier to select now.
3. Why Flint cannot be selected despite having higher contribution than Ember.
4. If Grove's approval becomes granted while every other fact stays unchanged, whether the selection changes and to whom.
5. Use only the supplied scenario facts.`;

function cookie(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const h of raw) {
    const m = String(h).match(/^empireai_session=([^;]+)/);
    if (m) return `empireai_session=${m[1]}`;
  }
  return null;
}

function checks(text) {
  const t = String(text || "");
  const fail = [];
  if (/\bCurrent\s+Eligible\s+set\s*:\s*none\b/i.test(t) && /\bEmber\b/i.test(t)) {
    fail.push("ELIGIBLE_NONE_WITH_EMBER");
  }
  if (/\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(t) && /\b(?:SELECT\s+Ember|only eligible supplier)\b/i.test(t)) {
    fail.push("DNS_VS_SELECT_EMBER");
  }
  if (/\bunproven\b/i.test(t) && /contribution minimum=unproven|stock availability=unproven|lead-time max days=unproven/i.test(t)) {
    fail.push("SUPPLIED_FACTS_AS_UNPROVEN");
  }
  if (!/\bEmber\b/i.test(t)) fail.push("MISSING_EMBER");
  if (!/\bFlint\b/i.test(t) || !/\b8\b/.test(t)) fail.push("MISSING_FLINT_DELIVERY_REASON");
  if (!/\bGrove\b/i.test(t)) fail.push("MISSING_GROVE_CF");
  const hasSelect = /\bSELECT\s+Ember\b|\bselect\s+Ember\b|\bonly eligible supplier\b/i.test(t);
  const hasEligibleEmber = /\bEligible\s+(?:set|Suppliers?)\s*:\s*[^\n]*Ember/i.test(t) || /\beligible set[^\n]*Ember/i.test(t);
  if (!hasSelect && !hasEligibleEmber) fail.push("NO_EMBER_SELECTION_SIGNAL");
  return { fail, ok: fail.length === 0 };
}

const health = await (await fetch(`${BRAIN}/health/live`)).json();
const lr = await fetch(`${COCKPIT}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const c = cookie(lr);
if (!c) throw new Error("login_failed");
const sr = await fetch(`${COCKPIT}/api/pillow/session`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: c },
  body: JSON.stringify({ forceNew: true }),
  signal: AbortSignal.timeout(60_000),
});
const sj = await sr.json();
const sid = sj.session?.sessionId || sj.sessionId;
const cr = await fetch(`${COCKPIT}/api/pillow/chat`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: c },
  body: JSON.stringify({
    sessionId: sid,
    message: HELIOS,
    workspaceContext: {
      screenPath: "/cockpit/development/pillow",
      screenId: "SCR-800",
      screenTitle: "Pillow Centre",
    },
  }),
  signal: AbortSignal.timeout(290_000),
});
const cj = await cr.json().catch(() => ({}));
const text = String(cj?.result?.message || "");
const requestId = cj?.result?.requestId || cr.headers.get("x-empire-pillow-request-id");
const result = checks(text);
const out = {
  generatedAt: new Date().toISOString(),
  MISSION: "HELIOS_W1T1_VISIBLE_DECISION_AUTHORITY",
  DEPLOYMENT_ID: health?.deploy?.deploymentId || null,
  RUNNING_SHA: health?.deploy?.gitCommitSha || null,
  requestId,
  status: cr.status,
  kind: cj?.result?.kind || null,
  checks: result,
  textPreview: text.slice(0, 1200),
  ENGINEERING_PASS: result.ok,
  WAVE_CREDIT: 0,
  WAVE_1: "0/24",
  STATUS: "ENGINEERING PASS ONLY — AWAITING ONE UNSEEN GRAND KING W1-T1",
};
mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "HELIOS_W1T1_PRODUCTION_VISIBLE_QUAL.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (!result.ok) process.exit(1);
