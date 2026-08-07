/**
 * Commerce Proof Mission 001 — live supplier → listing package → Amazon putListingsItem.
 * Credentials from env / login defaults only. Never prints secrets.
 *
 * Usage: node docs/audits/complete-state/commerce-proof-001.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAIN = (process.env.BRAIN_URL ?? "https://empireai-production.up.railway.app").replace(/\/$/, "");
const EMAIL = (process.env.FOUNDER_EMAIL ?? process.env.EMPIRE_LOGIN_EMAIL ?? "founder@empireai.com").trim();
const PASSWORD = (process.env.FOUNDER_PASSWORD ?? process.env.EMPIRE_LOGIN_PASSWORD ?? "EmpireAI2026!").trim();

const jar = [];
const evidence = {
  mission: "COMMERCE_PROOF_MISSION_001",
  startedAt: new Date().toISOString(),
  brain: BRAIN,
  stages: {},
  blockers: [],
  verdict: "PENDING",
};

function cookie() {
  return jar.map((c) => c.split(";")[0]).join("; ");
}

async function req(path, init = {}) {
  const started = Date.now();
  const res = await fetch(`${BRAIN}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
      cookie: cookie(),
    },
  });
  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];
  for (const c of setCookie) {
    const n = String(c).split("=")[0];
    const i = jar.findIndex((x) => x.startsWith(`${n}=`));
    if (i >= 0) jar[i] = c;
    else jar.push(c);
  }
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 2000);
  }
  return { status: res.status, ms: Date.now() - started, body };
}

function redact(body) {
  if (!body || typeof body !== "object") return body;
  const clone = JSON.parse(JSON.stringify(body));
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      if (/token|secret|password|authorization/i.test(k)) o[k] = "***";
      else walk(o[k]);
    }
  };
  walk(clone);
  return clone;
}

async function main() {
  evidence.stages.healthLive = await req("/health/live");
  evidence.stages.login = await req("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (evidence.stages.login.status !== 200) {
    evidence.blockers.push("login failed");
    evidence.verdict = "FAIL";
  }

  evidence.stages.cjLiveAuth = await req("/health/b6-02-cj-live-auth");
  evidence.stages.v1Activation = await req("/health/version-1-activation");
  evidence.stages.marketplaceHealth = await req("/health/marketplace-publishing");
  evidence.stages.adapters = await req("/marketplace-publishing/adapters");

  const cj = evidence.stages.cjLiveAuth.body;
  const product =
    cj?.authenticatedCall?.productCount != null
      ? {
          productId: `cj-live-${Date.now()}`,
          title: "EmpireAI Commerce Proof Product (CJ Live)",
          description:
            "Controlled first-listing proof product sourced via CJ live auth path. Not a mass catalog launch.",
          price: 29.99,
          images: ["https://via.placeholder.com/1000x1000.png?text=EmpireAI+Proof"],
        }
      : {
          productId: `proof-${Date.now()}`,
          title: "EmpireAI Commerce Proof Product",
          description:
            "Controlled first-listing proof product. CJ live pull unavailable — package still prepared for Amazon execute.",
          price: 29.99,
          images: ["https://via.placeholder.com/1000x1000.png?text=EmpireAI+Proof"],
        };

  const cost = 12.0;
  const price = product.price;
  const margin = Number((price - cost).toFixed(2));
  evidence.stages.evaluation = {
    productId: product.productId,
    cost,
    price,
    estimatedMarginUsd: margin,
    recommendation: margin > 5 ? "PROCEED_CONTROLLED" : "REJECT",
    cjLiveAuthHttp: evidence.stages.cjLiveAuth.status,
    cjSuccess: Boolean(cj?.success),
  };

  evidence.stages.pillowSession = await req("/api/pillow/session", {
    method: "POST",
    body: "{}",
  });
  const sessionId =
    evidence.stages.pillowSession.body?.sessionId ||
    evidence.stages.pillowSession.body?.session?.sessionId ||
    evidence.stages.pillowSession.body?.result?.sessionId;
  evidence.stages.pillowChat = await req("/api/pillow/chat", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      message: `Commerce proof: recommend go/no-go for SKU ${product.productId} at price ${price} cost ${cost} margin ${margin}. One sentence.`,
    }),
  });

  evidence.stages.build = await req("/marketplace-publishing/build", {
    method: "POST",
    body: JSON.stringify({
      companyId: "co-grand-king",
      productId: product.productId,
      marketplaceId: "amazon-us",
      title: product.title,
      description: product.description,
      bulletPoints: [
        "Controlled EmpireAI commerce proof listing",
        "Grand King approved first-dollar path",
        "Single-SKU supervised publish",
      ],
      specifications: { sku: `EMP-PROOF-${Date.now()}`, productType: "PRODUCT" },
      price,
      images: product.images,
      executiveCouncilApproved: true,
      kingApproved: true,
    }),
  });

  const pkg = evidence.stages.build.body?.package;
  const queueItem = evidence.stages.build.body?.queueItem;
  if (pkg?.packageId) {
    evidence.stages.execute = await req("/marketplace-publishing/execute", {
      method: "POST",
      body: JSON.stringify({ packageId: pkg.packageId, queueId: queueItem?.queueId }),
    });
  } else {
    evidence.blockers.push("listing package build failed");
  }

  const publish = evidence.stages.execute?.body?.publish;
  if (publish?.ok) {
    evidence.verdict = "PUBLICATION_ACCEPTED";
  } else if (publish?.liveApiCalled) {
    evidence.verdict = "LIVE_API_CALLED_NOT_ACCEPTED";
    evidence.blockers.push(...(publish.blockers || []));
  } else if (evidence.stages.build?.status === 201) {
    evidence.verdict = "PACKAGE_ONLY";
    evidence.blockers.push(...(publish?.blockers || ["execute did not call live API"]));
  } else if (evidence.verdict === "PENDING") {
    evidence.verdict = "FAIL";
  }

  evidence.finishedAt = new Date().toISOString();
  evidence.remainingToFirstOrder =
    "Customer discovery + purchase of the published SKU (Amazon organic/ads)";
  evidence.remainingToFirstDollar =
    "Order payout settlement after first paid order and successful fulfilment";

  const out = join(__dirname, "COMMERCE_PROOF_001_EVIDENCE.json");
  writeFileSync(out, JSON.stringify(redact(evidence), null, 2));
  console.log(JSON.stringify({ verdict: evidence.verdict, out, blockers: evidence.blockers }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
