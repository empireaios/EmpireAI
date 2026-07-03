import { ROLLBACK_PLAN, RESTART_STRATEGY } from "./platform-config.js";
import type { HealthStatus, RecoveryCoordinationPlan } from "./types.js";
import type { InfrastructureMonitorSnapshot } from "./types.js";

export function coordinateRecovery(
  issue: string,
  snapshot: InfrastructureMonitorSnapshot,
): RecoveryCoordinationPlan {
  const normalized = issue.toLowerCase();
  let category: RecoveryCoordinationPlan["category"] = "runtime";
  let severity: HealthStatus = snapshot.overallHealth;

  if (/build|typecheck|compile/i.test(normalized)) category = "build";
  else if (/deploy|railway|vercel/i.test(normalized)) category = "deployment";
  else if (/git|branch|commit|repository/i.test(normalized)) category = "repository";
  else if (/slow|degrad|502|503|504/i.test(normalized)) category = "degradation";

  const automatedSteps: string[] = [];
  const manualSteps: string[] = [];
  const rollbackSteps = [ROLLBACK_PLAN];

  if (category === "build") {
    automatedSteps.push("Run npm run typecheck and npm run build in affected package");
    automatedSteps.push("Interpret build log via Cursor Bridge validation pipeline");
    manualSteps.push("Fix reported errors and push to main");
  }

  if (category === "deployment") {
    automatedSteps.push("Probe Railway /health and Vercel /api/pillow/health");
    automatedSteps.push("Verify BRAIN_API_URL in empireai-web/vercel.json");
    manualSteps.push("Trigger Railway redeploy from latest main if health fails");
    manualSteps.push("Verify Vercel deployment logs for build failures");
  }

  if (category === "runtime") {
    automatedSteps.push(`Apply restart strategy: ${RESTART_STRATEGY}`);
    automatedSteps.push("Re-probe application endpoints after cooldown");
    manualSteps.push("Inspect Railway runtime logs for crash loops");
  }

  if (category === "degradation") {
    automatedSteps.push("Run Technical Chief diagnosis on reported symptom");
    automatedSteps.push("Monitor response times on Railway and Vercel BFF");
    manualSteps.push("Scale Railway service if sustained latency");
  }

  if (category === "repository") {
    automatedSteps.push("git status and sync check against origin/main");
    automatedSteps.push("Run Repository Synchronizer dry-run");
    manualSteps.push("Resolve diverged branches before next deploy");
  }

  if (snapshot.railway.health === "critical") {
    automatedSteps.unshift("Priority: restore Railway Brain /health to 200");
  }
  if (snapshot.vercel.health === "critical") {
    automatedSteps.unshift("Priority: restore Vercel BFF /api/pillow/health to 200");
  }

  return {
    issue,
    category,
    severity,
    automatedSteps,
    manualSteps,
    rollbackSteps,
    estimatedRecovery: severity === "critical" ? "15–45 minutes" : "5–20 minutes",
  };
}
