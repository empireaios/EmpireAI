import type { ScriptReport } from "./types.js";

/** Authoritative in-memory script store — script tracking only. */
export class ScriptStore {
  private scripts = new Map<string, ScriptReport>();
  private latestScriptId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    scriptId: string;
    action: string;
    details: string;
  }> = [];

  seed(scripts: ScriptReport[]) {
    this.scripts.clear();
    this.latestScriptId = null;
    this.auditTrail = [];
    for (const script of scripts) {
      this.scripts.set(script.scriptId, clone(script));
      this.latestScriptId = script.scriptId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        scriptId: script.scriptId,
        action: "seed",
        details: `seeded script=${script.scriptId} format=${script.contentFormat}`,
      });
    }
  }

  count() {
    return this.scripts.size;
  }

  list() {
    return [...this.scripts.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(scriptId: string) {
    const script = this.scripts.get(scriptId);
    return script ? clone(script) : null;
  }

  getLatestScriptId() {
    return this.latestScriptId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(script: ScriptReport, action = "save") {
    this.scripts.set(script.scriptId, clone(script));
    this.latestScriptId = script.scriptId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      scriptId: script.scriptId,
      action,
      details: `format=${script.contentFormat} sections=${script.scriptSections.length} confidence=${script.confidenceScore}`,
    });
    return clone(script);
  }

  markSubmitted(scriptId: string, executiveReportId: string) {
    const current = this.scripts.get(scriptId);
    if (!current) return null;
    const updated: ScriptReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function clone(script: ScriptReport): ScriptReport {
  return {
    ...script,
    scriptSections: script.scriptSections.map((s) => ({ ...s })),
    traceabilityRefs: [...script.traceabilityRefs],
    preservedDecisions: script.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: script.selfReviewFindings.map((f) => ({ ...f })),
  };
}
