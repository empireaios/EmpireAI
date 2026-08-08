/** Scan empire-ai.co Next chunks for EOS UX markers (no secrets). */
const WEB = (process.env.WEB_URL ?? "https://empire-ai.co").replace(/\/$/, "");
const pages = ["/login", "/cockpit"];
let scan = "";
const scriptSet = new Set();
const pageMeta = [];
for (const page of pages) {
  const res = await fetch(`${WEB}${page}`, { redirect: "follow" });
  const html = await res.text();
  scan += html;
  pageMeta.push({ page, status: res.status, finalUrl: res.url });
  for (const m of html.matchAll(/\/_next\/static\/[^"']+\.js/g)) {
    scriptSet.add(m[0]);
  }
}
let scanned = 0;
for (const rel of [...scriptSet].slice(0, 50)) {
  try {
    const t = await (await fetch(`${WEB}${rel}`)).text();
    scan += t;
    scanned += 1;
  } catch {
    /* ignore */
  }
}
const out = {
  pages: pageMeta,
  scriptsFound: scriptSet.size,
  scriptsScanned: scanned,
  composerAlwaysOn: /type now; Send when ready/i.test(scan),
  deferredStrips: /DeferredExecutiveSystemStrips|Load extended panels/i.test(scan),
  postureClear: /Empire operating posture clear/i.test(scan),
  retryPlaceholder: /Retry loading executive widgets|Retry when Brain is ready/i.test(scan),
};
out.eosFixInBundle =
  out.composerAlwaysOn || out.deferredStrips || out.postureClear;
console.log(JSON.stringify(out, null, 2));
process.exit(out.eosFixInBundle && !out.retryPlaceholder ? 0 : 1);
