/**
 * CQ-05 — Deliver Grand King + ChatGPT challenge to REAL Pillow runtime.
 * Does not invent Pillow's commercial answer. Captures raw response only.
 *
 * Usage: node backend/scripts/cq05-pillow-commercial-challenge.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const COCKPIT = process.env.EMPIRE_COCKPIT_URL || "https://empire-ai.co";
const EMAIL =
  process.env.EMPIRE_LOGIN_EMAIL || process.env.FOUNDER_EMAIL || "founder@empireai.com";
const PASSWORD =
  process.env.EMPIRE_LOGIN_PASSWORD || process.env.FOUNDER_PASSWORD || "EmpireAI2026!";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = path.join(ROOT, "docs/audits/complete-state");

const CHALLENGE = `CQ-05 — Grand King + ChatGPT commercial judgment challenge of your CQ-04 one-product commissioning decision.

Canonical product (preserve as historical CQ-04 selection):
Women Vintage Embroidered Floral Tank Vest Y2k Sleeveless V Neck Cardigan Tops Retro Cropped Open Front Street Gilet (A-Black, S)

Your CQ-04 recommendation was APPROVE.

Dossier facts (do not invent beyond these; UNKNOWN remains UNKNOWN):
- Our proposed price ≈ $52.15 (ESTIMATED)
- Lowest competing offer ≈ $29.98 (PARTIAL)
- Price premium ≈ +74%
- Demand = UNKNOWN
- supplierCanMeetDelivery = UNKNOWN
- Competing offer evidence is incomplete / PARTIAL
- Catalog ASIN match may be keyword-based
- Offer is not published; BUYABLE is not verified
- Expected profit is ESTIMATED, not realised

Challenge:
Why are you recommending APPROVE?

You are proposing approximately $52.15 while the lowest observed competing offer is approximately $29.98, a premium of roughly 74%.

Demand is UNKNOWN.

Supplier delivery capability is UNKNOWN.

Competitive evidence is incomplete.

The product is not BUYABLE.

Explain why this is presently a commercially rational opportunity rather than merely the survivor with the highest calculated expected profit.

What evidence demonstrates that customers are likely to buy from us at this price?

If that evidence does not exist, explain why APPROVE is justified.

Identify what you do not know.

Tell us what evidence you would seek before committing.

Consider whether this product should instead be REJECTED, HELD FOR EVIDENCE, REPRICED, or replaced by a stronger alternative.

Critique your original decision.

Then give your final disposition and explain exactly what caused you either to retain or change your judgment.

Answer as Pillow from dossier evidence and institutional memory only. Do not invent LIVE demand, sales, or competitor facts.`;

function jar(res) {
  const raw = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  const hdr = res.headers.get("set-cookie");
  const all = raw.length ? raw : hdr ? [hdr] : [];
  return all.map((c) => String(c).split(";")[0]).filter(Boolean);
}

async function main() {
  const out = {
    artifact: "CQ05_PILLOW_COMMERCIAL_JUDGMENT_CHALLENGE",
    startedAt: new Date().toISOString(),
    cockpit: COCKPIT,
    source: "REAL_PILLOW_RUNTIME",
    cursorAuthoredCommercialAnswer: false,
    publicationAttempted: false,
    supplierSpendAttempted: false,
    birthAuthorised: false,
    thousandRelease: false,
    steps: {},
  };

  const loginRes = await fetch(`${COCKPIT}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookie = jar(loginRes).join("; ");
  out.steps.login = { status: loginRes.status, cookiePresent: Boolean(cookie) };
  if (!loginRes.ok || !cookie) {
    out.blocked = "LOGIN_FAILED";
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      path.join(OUT_DIR, "CQ05_PILLOW_COMMERCIAL_JUDGMENT_CHALLENGE_EVIDENCE.json"),
      JSON.stringify(out, null, 2),
    );
    console.error("LOGIN_FAILED", loginRes.status);
    process.exit(1);
  }

  const dossierRes = await fetch(
    `${COCKPIT}/api/pillow-commissioning/one-product/decision-dossier`,
    { headers: { cookie } },
  );
  const dossierJson = await dossierRes.json().catch(() => ({}));
  const d = dossierJson.dossier || null;
  out.originalCq04 = {
    productName:
      d?.product?.plainName ||
      "Women Vintage Embroidered Floral Tank Vest Y2k Sleeveless V Neck Cardigan Tops Retro Cropped Open Front Street Gilet (A-Black, S)",
    recommendation: d?.pillowRecommendation?.verdict || "APPROVE",
    confidence: d?.pillowRecommendation?.confidence || null,
    why: d?.pillowRecommendation?.why || null,
    ourPrice: d?.economics?.ourPrice?.display || "$52.15",
    lowestCompetitor: d?.economics?.lowestCompetitor?.display || "$29.98",
    priceDifferencePct: d?.economics?.priceDifferencePct || "+74%",
    demand: d?.demand?.evidence || "UNKNOWN",
    deliverySupplierCanMeet: d?.delivery?.supplierCanMeet || "UNKNOWN",
    dossierHttpStatus: dossierRes.status,
    dossierOk: Boolean(dossierJson.ok),
    note: "CQ-04 historical APPROVE preserved even if live recompute differs",
  };

  const sessRes = await fetch(`${COCKPIT}/api/pillow/session`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: "{}",
  });
  const sessJson = await sessRes.json().catch(() => ({}));
  const sessionId =
    sessJson.sessionId || sessJson.result?.sessionId || sessJson.session?.sessionId;
  out.steps.session = {
    status: sessRes.status,
    sessionId: sessionId || null,
    error: sessJson.error || null,
  };
  if (!sessRes.ok || !sessionId) {
    out.blocked = "PILLOW_SESSION_FAILED";
    out.engineeringCause = JSON.stringify(sessJson).slice(0, 800);
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      path.join(OUT_DIR, "CQ05_PILLOW_COMMERCIAL_JUDGMENT_CHALLENGE_EVIDENCE.json"),
      JSON.stringify(out, null, 2),
    );
    console.error("PILLOW_SESSION_FAILED", sessRes.status);
    process.exit(2);
  }

  const t0 = Date.now();
  const chatRes = await fetch(`${COCKPIT}/api/pillow/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      sessionId,
      message: CHALLENGE,
      workspaceContext: {
        screenPath: "/cockpit",
        screenId: "SCR-001",
        screenTitle: "Executive Home",
        module: "executive-home",
        workflow: "cq05-commercial-judgment-challenge",
        purpose: "Grand King + ChatGPT challenge of CQ-04 one-product decision",
        currentBusiness: "EmpireAI",
        currentMission: "CQ-05 Pillow Commercial Judgment Challenge",
        recommendations: ["Defend or revise CQ-04 APPROVE using evidence only"],
        risks: ["+74% price premium", "demand UNKNOWN", "delivery UNKNOWN", "not BUYABLE"],
        cq04Product: out.originalCq04.productName,
        cq04Recommendation: "APPROVE",
      },
    }),
  });
  const chatJson = await chatRes.json().catch(() => ({}));
  const result = chatJson.result || chatJson;
  const message = result.message || result.content || "";
  out.steps.chat = {
    status: chatRes.status,
    ms: Date.now() - t0,
    provider: result.provider || null,
    model: result.model || null,
    kind: result.kind || null,
    hasMessage: Boolean(message),
    messageLength: message.length,
    fidelityAdjusted: result.executiveDeliberation?.fidelityAdjusted ?? null,
    challengeStance: result.executiveDeliberation?.challengeStance ?? null,
  };
  out.challengeDelivered = CHALLENGE;
  out.pillowActualResponse = message;
  out.pillowRawResultKeys = Object.keys(result || {});
  out.executiveDeliberation = result.executiveDeliberation || null;
  out.completedAt = new Date().toISOString();

  if (!chatRes.ok || !message) {
    out.blocked = "PILLOW_CHAT_FAILED_OR_EMPTY";
    out.engineeringCause = JSON.stringify(chatJson).slice(0, 1200);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    path.join(OUT_DIR, "CQ05_PILLOW_COMMERCIAL_JUDGMENT_CHALLENGE_EVIDENCE.json"),
    JSON.stringify(out, null, 2),
  );
  writeFileSync(path.join(OUT_DIR, "_cq05_pillow_response.txt"), message || "(empty)");
  console.log(
    JSON.stringify(
      {
        ok: Boolean(message) && chatRes.ok,
        status: chatRes.status,
        ms: out.steps.chat.ms,
        provider: out.steps.chat.provider,
        model: out.steps.chat.model,
        messageLength: message.length,
        preview: message.slice(0, 800),
        blocked: out.blocked || null,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  const cause = e?.cause;
  console.error(String(e), cause ? JSON.stringify({ code: cause.code, message: cause.message, errno: cause.errno }) : "");
  try {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      path.join(OUT_DIR, "CQ05_PILLOW_COMMERCIAL_JUDGMENT_CHALLENGE_EVIDENCE.json"),
      JSON.stringify(
        {
          artifact: "CQ05_PILLOW_COMMERCIAL_JUDGMENT_CHALLENGE",
          blocked: "NETWORK_OR_RUNTIME_FETCH_FAILED",
          engineeringCause: String(e?.stack || e),
          causeCode: cause?.code || null,
          cockpit: COCKPIT,
          cursorAuthoredCommercialAnswer: false,
          completedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  } catch {
    /* ignore */
  }
  process.exit(1);
});
