/**
 * Authenticated Cockpit surface scan for EOS UX markers.
 * Credentials from env only — never printed.
 */
const WEB = (process.env.WEB_URL ?? "https://empire-ai.co").replace(/\/$/, "");
const EMAIL = (process.env.FOUNDER_EMAIL ?? process.env.EMPIRE_LOGIN_EMAIL ?? "").trim();
const PASSWORD = (process.env.FOUNDER_PASSWORD ?? process.env.EMPIRE_LOGIN_PASSWORD ?? "").trim();
if (!EMAIL || !PASSWORD) {
  console.error("FOUNDER_EMAIL / FOUNDER_PASSWORD required");
  process.exit(2);
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

const login = await fetch(`${WEB}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
await captureSetCookie(login);
const loginBody = await login.json().catch(() => ({}));

const me = await fetch(`${WEB}/api/auth/me`, { headers: { cookie: cookie() } });
const cockpit = await fetch(`${WEB}/cockpit`, {
  headers: { cookie: cookie() },
  redirect: "follow",
});
const html = await cockpit.text();
const scriptSet = new Set([...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]));
// Also pull build manifest if present
for (const m of html.matchAll(/\/_next\/static\/[^"']+\/_buildManifest\.js/g)) {
  scriptSet.add(m[0]);
}
let scan = html;
let scanned = 0;
for (const rel of [...scriptSet].slice(0, 60)) {
  try {
    const t = await (await fetch(`${WEB}${rel}`)).text();
    scan += t;
    scanned += 1;
  } catch {
    /* ignore */
  }
}

const stampRes = await fetch(`${WEB}/api/eos-bundle-stamp`, { cache: "no-store" });
const stamp = stampRes.ok ? await stampRes.json().catch(() => null) : null;
const loginHead = await fetch(`${WEB}/login`, { method: "HEAD" });
const loginCdnAgeSec = Number(loginHead.headers.get("age") ?? NaN);

const out = {
  loginStatus: login.status,
  meStatus: me.status,
  cockpitStatus: cockpit.status,
  cockpitUrl: cockpit.url,
  hasSessionCookie: /empireai_session=/i.test(cookie()),
  platformIdentity: loginBody?.user?.platformIdentity ?? null,
  scriptsFound: scriptSet.size,
  scriptsScanned: scanned,
  composerAlwaysOn: /type now; Send when ready/i.test(scan),
  deferredStrips: /DeferredExecutiveSystemStrips|Load extended panels/i.test(scan),
  postureClear: /Empire operating posture clear/i.test(scan),
  retryPlaceholder: /Retry loading executive widgets|Retry when Brain is ready/i.test(scan),
  legacyUnlockCopy: /conversation will unlock when ready/i.test(scan),
  legacyPreparingCopy: /Preparing Executive Intelligence/i.test(scan),
  hasExecutiveChat: /Executive Chat|executive-pillow-query/i.test(scan),
  stampStatus: stampRes.status,
  stamp,
  loginCdnAgeSec: Number.isFinite(loginCdnAgeSec) ? loginCdnAgeSec : null,
};
out.eosFixInBundle = out.composerAlwaysOn || out.deferredStrips || out.postureClear || Boolean(stamp?.eosFixInBundle);
out.productionBundleVerified =
  Boolean(out.eosFixInBundle) && !out.legacyUnlockCopy && !out.retryPlaceholder;
out.deploymentClassification = out.productionBundleVerified
  ? "PRODUCTION_BUNDLE_VERIFIED"
  : "SOURCE_PUSHED_NOT_PRODUCTION_DEPLOYED";
console.log(JSON.stringify(out, null, 2));
process.exit(out.productionBundleVerified && out.hasSessionCookie && out.meStatus === 200 ? 0 : 1);
