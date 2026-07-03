import { INFRASTRUCTURE_ENDPOINTS, ROLLBACK_PLAN } from "./platform-config.js";
import type { HealthStatus, VercelOrchestrationSnapshot } from "./types.js";

export async function orchestrateVercel(): Promise<VercelOrchestrationSnapshot> {
  const baseUrl = INFRASTRUCTURE_ENDPOINTS.vercel.productionUrl.replace(/\/$/, "");
  const findings: string[] = [];

  const homeProbe = await probe(`${baseUrl}${INFRASTRUCTURE_ENDPOINTS.vercel.homePath}`);
  const bffProbe = await probe(`${baseUrl}${INFRASTRUCTURE_ENDPOINTS.vercel.pillowBffPath}`);

  const frontendReachable = homeProbe.ok;
  if (!frontendReachable) findings.push(`Vercel frontend unreachable: HTTP ${homeProbe.status ?? "timeout"}`);

  let bffHealth: HealthStatus = "unknown";
  let pillowProxyOk = false;
  if (bffProbe.ok) {
    pillowProxyOk = /running|Idle|"health"/i.test(bffProbe.body ?? "");
    bffHealth = pillowProxyOk ? "healthy" : "degraded";
    if (!pillowProxyOk) findings.push("Vercel BFF Pillow proxy response unexpected");
  } else {
    bffHealth = "critical";
    findings.push(`Vercel BFF /api/pillow/health failed: HTTP ${bffProbe.status ?? "timeout"}`);
  }

  const buildValidation: HealthStatus = frontendReachable && bffProbe.ok ? "healthy" : "degraded";

  const health: HealthStatus =
    bffHealth === "critical" ? "critical" :
    !frontendReachable || bffHealth === "degraded" ? "degraded" :
    "healthy";

  return {
    platform: "vercel",
    productionUrl: baseUrl,
    frontendReachable,
    bffHealth,
    pillowProxyOk,
    routingNotes: [
      "Next.js BFF proxies /api/pillow/* to Railway BRAIN_API_URL",
      "Production domain: empire-ai.co",
      ROLLBACK_PLAN,
    ],
    buildValidation,
    health,
    findings,
  };
}

async function probe(url: string): Promise<{
  ok: boolean;
  status: number | null;
  body: string | null;
}> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: null, body: null };
  }
}
