type RequestMetric = {
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
  at: string;
};

const MAX_SAMPLES = 200;
const samples: RequestMetric[] = [];
let totalRequests = 0;
let errorRequests = 0;

export function recordRequest(metric: Omit<RequestMetric, "at">): void {
  totalRequests += 1;
  if (metric.statusCode >= 500) errorRequests += 1;

  samples.push({ ...metric, at: new Date().toISOString() });
  if (samples.length > MAX_SAMPLES) samples.shift();
}

export function getObservabilitySnapshot() {
  const recent = samples.slice(-20);
  const avgLatency =
    recent.length > 0
      ? recent.reduce((sum, item) => sum + item.durationMs, 0) / recent.length
      : 0;

  return {
    totalRequests,
    errorRequests,
    errorRate: totalRequests > 0 ? errorRequests / totalRequests : 0,
    avgLatencyMs: Math.round(avgLatency),
    recent,
  };
}
