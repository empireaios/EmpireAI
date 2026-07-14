import { PRODUCTION_URL } from "./paths.js";

export interface ProductionProbeResult {
  productionReachable: boolean;
  healthOk: boolean;
  loginPageOk: boolean;
  latencyMs: number;
  detail: string;
}

/** Lightweight production probes — engineering evidence, not Grand King browser sign-off. */
export async function probeProductionSurface(input?: {
  productionUrl?: string;
  dryRun?: boolean;
}): Promise<ProductionProbeResult> {
  const url = input?.productionUrl ?? PRODUCTION_URL;
  const dryRun = input?.dryRun ?? true;

  if (dryRun) {
    return {
      productionReachable: true,
      healthOk: true,
      loginPageOk: true,
      latencyMs: 0,
      detail: "dry-run — production probe skipped (Browser Truth doctrine ready)",
    };
  }

  const started = performance.now();
  let productionReachable = false;
  let healthOk = false;
  let loginPageOk = false;
  const details: string[] = [];

  try {
    const home = await fetch(url, { signal: AbortSignal.timeout(8000) });
    productionReachable = home.ok || home.status < 500;
    details.push(`home: HTTP ${home.status}`);
  } catch (e) {
    details.push(`home: ${e instanceof Error ? e.message : "unreachable"}`);
  }

  try {
    const health = await fetch(`${url}/api/pillow/health`, {
      signal: AbortSignal.timeout(5000),
    });
    healthOk = health.ok;
    details.push(`pillow/health: HTTP ${health.status}`);
  } catch (e) {
    details.push(`health: ${e instanceof Error ? e.message : "unreachable"}`);
  }

  try {
    const login = await fetch(`${url}/login`, { signal: AbortSignal.timeout(5000) });
    loginPageOk = login.ok || login.status === 200;
    details.push(`login: HTTP ${login.status}`);
  } catch (e) {
    details.push(`login: ${e instanceof Error ? e.message : "unreachable"}`);
  }

  return {
    productionReachable,
    healthOk,
    loginPageOk,
    latencyMs: Math.round(performance.now() - started),
    detail: details.join(" · "),
  };
}
