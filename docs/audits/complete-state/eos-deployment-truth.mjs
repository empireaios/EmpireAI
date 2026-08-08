/**
 * Deployment-drift truth for EOS closure.
 * Layers: SOURCE_PUSHED → PRODUCTION_CDN/STAMP → PRODUCTION_BUNDLE_VERIFIED
 * Credentials from env only. No secrets printed.
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = (process.env.WEB_URL ?? "https://empire-ai.co").replace(/\/$/, "");
const EMAIL = (process.env.FOUNDER_EMAIL ?? process.env.EMPIRE_LOGIN_EMAIL ?? "").trim();
const PASSWORD = (process.env.FOUNDER_PASSWORD ?? process.env.EMPIRE_LOGIN_PASSWORD ?? "").trim();
const OUT = join(__dirname, "EOS_DEPLOYMENT_TRUTH_EVIDENCE.json");
const STALE_CDN_AGE_SEC = Number(process.env.EOS_STALE_CDN_AGE_SEC ?? 7 * 86400);

function git(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const jar = [];
function cookie() {
  return jar.map((c) => String(c).split(";")[0]).join("; ");
}
async function captureSetCookie(res) {
  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];
  for (const c of setCookie) {
    if (!c) continue;
    const n = String(c).split("=")[0];
    const i = jar.findIndex((x) => x.startsWith(`${n}=`));
    if (i >= 0) jar[i] = c;
    else jar.push(c);
  }
}

async function main() {
  const sourceSha = git("git rev-parse HEAD");
  const originSha = git("git rev-parse origin/main");
  const aheadBehind = git("git rev-list --left-right --count origin/main...HEAD");
  const sourceHasEosFix = Boolean(
    git(
      'git grep -n "type now; Send when ready" HEAD -- empireai-web/components/cockpit/executive/ExecutiveHomeChatWorkspace.tsx',
    ),
  );

  const loginHead = await fetch(`${WEB}/login`, { method: "HEAD", redirect: "follow" });
  const loginAgeSec = Number(loginHead.headers.get("age") ?? NaN);
  const vercelCache = loginHead.headers.get("x-vercel-cache");
  const stampRes = await fetch(`${WEB}/api/eos-bundle-stamp`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  let stamp = null;
  if (stampRes.ok) {
    stamp = await stampRes.json().catch(() => null);
  }

  let bundle = null;
  if (EMAIL && PASSWORD) {
    const login = await fetch(`${WEB}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    await captureSetCookie(login);
    const cockpit = await fetch(`${WEB}/cockpit`, {
      headers: { cookie: cookie() },
      redirect: "follow",
    });
    const html = await cockpit.text();
    const scripts = [...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]);
    let scan = html;
    for (const rel of scripts.slice(0, 60)) {
      try {
        scan += await (await fetch(`${WEB}${rel}`)).text();
      } catch {
        /* ignore */
      }
    }
    bundle = {
      loginStatus: login.status,
      cockpitStatus: cockpit.status,
      scriptsScanned: Math.min(scripts.length, 60),
      composerAlwaysOn: /type now; Send when ready/i.test(scan),
      deferredStrips: /DeferredExecutiveSystemStrips|Load extended panels/i.test(scan),
      postureClear: /Empire operating posture clear/i.test(scan),
      retryPlaceholder: /Retry loading executive widgets|Retry when Brain is ready/i.test(scan),
      legacyUnlockCopy: /conversation will unlock when ready/i.test(scan),
      legacyPreparingCopy: /Preparing Executive Intelligence/i.test(scan),
      hasExecutiveChat: /Executive Chat|executive-pillow-query/i.test(scan),
    };
    bundle.eosFixInBundle =
      bundle.composerAlwaysOn || bundle.deferredStrips || bundle.postureClear;
  }

  const stampSha = stamp?.gitCommitSha ? String(stamp.gitCommitSha).slice(0, 40) : null;
  const sourceMatchesStamp =
    Boolean(sourceSha && stampSha) &&
    (sourceSha === stampSha || sourceSha.startsWith(stampSha) || stampSha.startsWith(sourceSha.slice(0, 7)));
  const productionBundleVerified = Boolean(
    bundle?.eosFixInBundle && !bundle?.legacyUnlockCopy && !bundle?.retryPlaceholder,
  );
  const cdnLooksStale = Number.isFinite(loginAgeSec) && loginAgeSec >= STALE_CDN_AGE_SEC;
  const stampMissing = stampRes.status === 404 || !stamp;

  let classification = "UNKNOWN";
  if (productionBundleVerified && (sourceMatchesStamp || stamp?.eosFixInBundle)) {
    classification = "PRODUCTION_BUNDLE_VERIFIED";
  } else if (sourceHasEosFix && (!productionBundleVerified || stampMissing || cdnLooksStale)) {
    classification = "SOURCE_PUSHED_NOT_PRODUCTION_DEPLOYED";
  } else if (!sourceHasEosFix) {
    classification = "SOURCE_MISSING_EOS_FIX";
  } else {
    classification = "DEPLOYMENT_DRIFT_SUSPECTED";
  }

  const evidence = {
    mission: "EOS_DEPLOYMENT_TRUTH",
    checkedAt: new Date().toISOString(),
    web: WEB,
    layers: {
      SOURCE_PUSHED: {
        localHead: sourceSha,
        originMain: originSha,
        aheadBehind,
        sourceHasEosFix,
      },
      DEPLOYMENT_READY: {
        note: "Vercel Ready ≠ domain verified. Stamp/CDN used as deployment signals.",
        loginStatus: loginHead.status,
        loginCdnAgeSec: Number.isFinite(loginAgeSec) ? loginAgeSec : null,
        vercelCache,
        cdnLooksStale,
        stampStatus: stampRes.status,
        stamp,
        sourceMatchesStamp,
      },
      PRODUCTION_BUNDLE_VERIFIED: {
        scanned: Boolean(bundle),
        ...bundle,
        productionBundleVerified,
      },
    },
    classification,
    ok: classification === "PRODUCTION_BUNDLE_VERIFIED",
  };

  writeFileSync(OUT, JSON.stringify(evidence, null, 2));
  console.log(
    JSON.stringify(
      {
        ok: evidence.ok,
        classification,
        out: OUT,
        sourceHasEosFix,
        eosFixInBundle: bundle?.eosFixInBundle ?? null,
        legacyUnlockCopy: bundle?.legacyUnlockCopy ?? null,
        retryPlaceholder: bundle?.retryPlaceholder ?? null,
        loginCdnAgeSec: evidence.layers.DEPLOYMENT_READY.loginCdnAgeSec,
        stampStatus: stampRes.status,
        stampSha,
      },
      null,
      2,
    ),
  );
  process.exit(evidence.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(String(err?.stack || err));
  process.exit(1);
});
