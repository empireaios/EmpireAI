import { INFRASTRUCTURE_ENDPOINTS, RESTART_STRATEGY, ROLLBACK_PLAN } from "./platform-config.js";
import type { HealthStatus, RailwayOrchestrationSnapshot } from "./types.js";

export async function orchestrateRailway(): Promise<RailwayOrchestrationSnapshot> {
  const baseUrl = INFRASTRUCTURE_ENDPOINTS.railway.baseUrl.replace(/\/$/, "");
  const findings: string[] = [];

  const healthProbe = await probeJson(`${baseUrl}${INFRASTRUCTURE_ENDPOINTS.railway.healthPath}`);
  const pillowProbe = await probeJson(`${baseUrl}${INFRASTRUCTURE_ENDPOINTS.railway.pillowPath}`);

  let brainOnline = false;
  if (healthProbe.ok && healthProbe.body) {
    brainOnline =
      /"status"\s*:\s*"ok"/i.test(healthProbe.body) ||
      /"brain"\s*:\s*"online"/i.test(healthProbe.body);
    if (!brainOnline) findings.push("Brain health response not reporting online");
  } else {
    findings.push(`Railway /health failed: HTTP ${healthProbe.status ?? "timeout"}`);
  }

  let pillowHealth: HealthStatus = "unknown";
  if (pillowProbe.ok) {
    if (/running|Idle/i.test(pillowProbe.body ?? "")) pillowHealth = "healthy";
    else if (/error|Error/i.test(pillowProbe.body ?? "")) {
      pillowHealth = "degraded";
      findings.push("Pillow health reports error state on Railway");
    } else pillowHealth = "healthy";
  } else {
    pillowHealth = healthProbe.ok ? "degraded" : "critical";
    if (!pillowProbe.ok) findings.push(`Railway Pillow health failed: HTTP ${pillowProbe.status ?? "timeout"}`);
  }

  const healthEndpoint: HealthStatus =
    healthProbe.ok && brainOnline ? "healthy" : healthProbe.ok ? "degraded" : "critical";

  const health: HealthStatus =
    healthEndpoint === "critical" ? "critical" :
    pillowHealth === "degraded" || healthEndpoint === "degraded" ? "degraded" :
    "healthy";

  return {
    platform: "railway",
    serviceUrl: baseUrl,
    healthEndpoint,
    brainOnline,
    pillowHealth,
    responseMs: healthProbe.durationMs,
    deploymentNotes: [
      "Nixpacks build from railway.toml",
      "Health check path /health (120s timeout)",
    ],
    restartStrategy: RESTART_STRATEGY,
    rollbackPlan: ROLLBACK_PLAN,
    health,
    findings,
  };
}

async function probeJson(url: string): Promise<{
  ok: boolean;
  status: number | null;
  body: string | null;
  durationMs: number | null;
}> {
  const started = performance.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: "application/json" },
    });
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      body,
      durationMs: Math.round(performance.now() - started),
    };
  } catch {
    return { ok: false, status: null, body: null, durationMs: Math.round(performance.now() - started) };
  }
}
