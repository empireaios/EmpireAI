/**
 * Wait until brain deploy SHA matches expected tip, then exit 0.
 * Usage: node wait-sha.mjs <expectedShaPrefix>
 */
const BRAIN = process.env.EMPIRE_BRAIN_URL || "https://empireai-production.up.railway.app";
const want = (process.argv[2] || "").slice(0, 8);
if (!want) {
  console.error("usage: wait-sha.mjs <sha>");
  process.exit(2);
}
const deadline = Date.now() + 20 * 60_000;
while (Date.now() < deadline) {
  const h = await (await fetch(`${BRAIN}/health/live`)).json().catch(() => ({}));
  const sha = String(h?.deploy?.gitCommitSha || "");
  const online = !!h?.worker?.online;
  console.log(JSON.stringify({ sha: sha.slice(0, 12), online, deploy: h?.deploy?.deploymentId }));
  if (online && sha.startsWith(want)) {
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 15_000));
}
process.exit(1);
