import type { DependencyStatus, EngineHealthStatus, IntegrationHandshake } from "./types.js";
import type { RuntimeStore } from "./runtime-store.js";

export class HealthMonitor {
  evaluate(
    store: RuntimeStore,
    handshakes: IntegrationHandshake[],
    dependencyStatus: DependencyStatus[],
  ): { healthStatus: EngineHealthStatus; healthScore: number; notes: string[] } {
    const factories = store.listFactories();
    const workers = store.listWorkers();
    const services = store.listServices();
    const notes: string[] = [];

    const unavailableDeps = dependencyStatus.filter((d) => d.status === "unavailable").length;
    const totalDeps = dependencyStatus.length;
    const probedHealthy = handshakes.filter((h) => h.available).length;

    if (factories.length === 0) {
      notes.push("No factories registered");
      return { healthStatus: "failed", healthScore: 0, notes };
    }

    if (services.length === 0) {
      notes.push("Runtime services not bootstrapped");
      return { healthStatus: "degraded", healthScore: 40, notes };
    }

    if (unavailableDeps === totalDeps) {
      notes.push("All integration dependencies unavailable");
      return { healthStatus: "unavailable", healthScore: 30, notes };
    }

    if (unavailableDeps > 0) {
      notes.push(`${unavailableDeps}/${totalDeps} dependencies unavailable — not fabricating healthy state`);
      const score = Math.max(45, Math.round(((totalDeps - unavailableDeps) / totalDeps) * 80));
      return { healthStatus: "degraded", healthScore: score, notes };
    }

    notes.push(
      `Factories=${factories.length}, workers=${workers.length}, services=${services.length}, probed integrations=${probedHealthy}`,
    );
    const fabricatedHealthy = factories.some((f) => f.healthStatus === "healthy" && !f.evidencePresent);
    if (fabricatedHealthy) {
      notes.push("Detected fabricated healthy factory state — marking degraded");
      return { healthStatus: "degraded", healthScore: 55, notes };
    }

    return { healthStatus: "healthy", healthScore: 85, notes };
  }
}
