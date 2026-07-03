import { INFRASTRUCTURE_ENDPOINTS } from "./platform-config.js";
import type { ApplicationHealthSnapshot, HealthStatus } from "./types.js";

export async function probeApplicationHealth(): Promise<ApplicationHealthSnapshot> {
  const vercelBase = INFRASTRUCTURE_ENDPOINTS.vercel.productionUrl.replace(/\/$/, "");
  const railwayBase = INFRASTRUCTURE_ENDPOINTS.railway.baseUrl.replace(/\/$/, "");
  const findings: string[] = [];

  const paths = [
    `${vercelBase}/api/pillow/health`,
    `${railwayBase}/health`,
    `${vercelBase}/`,
  ];

  const endpoints: ApplicationHealthSnapshot["endpoints"] = [];
  for (const path of paths) {
    try {
      const res = await fetch(path, { signal: AbortSignal.timeout(15_000) });
      endpoints.push({ path, status: res.status, ok: res.ok });
      if (!res.ok) findings.push(`${path} returned HTTP ${res.status}`);
    } catch {
      endpoints.push({ path, status: null, ok: false });
      findings.push(`${path} unreachable`);
    }
  }

  const allOk = endpoints.every((e) => e.ok);
  const someOk = endpoints.some((e) => e.ok);

  const serviceAvailability: HealthStatus = allOk ? "healthy" : someOk ? "degraded" : "critical";

  return {
    platform: "application",
    endpoints,
    certificateOk: vercelBase.startsWith("https://") && railwayBase.startsWith("https://"),
    serviceAvailability,
    health: serviceAvailability,
    findings,
  };
}
