import type {
  ApiConnection,
  ApiProviderRegistration,
  ApiRequestTrace,
  ApiRuntimeReport,
} from "./types.js";

let sequence = 0;

export function resetApirtSequenceForTesting() {
  sequence = 0;
}

export function nextApirtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class ApiStore {
  private providers = new Map<string, ApiProviderRegistration>();
  private connections = new Map<string, ApiConnection>();
  private traces: ApiRequestTrace[] = [];
  private reports: ApiRuntimeReport[] = [];
  private auditTrail: string[] = [];

  saveProvider(provider: ApiProviderRegistration) {
    const snapshot = this.cloneProvider(provider);
    this.providers.set(provider.apiId, snapshot);
    this.auditTrail.push(`provider_saved:${provider.apiId}@${new Date().toISOString()}`);
    return snapshot;
  }

  getProvider(apiId: string) {
    const provider = this.providers.get(apiId);
    return provider ? this.cloneProvider(provider) : null;
  }

  listProviders() {
    return [...this.providers.values()]
      .map((p) => this.cloneProvider(p))
      .sort((a, b) => a.apiId.localeCompare(b.apiId));
  }

  updateProvider(apiId: string, patch: Partial<ApiProviderRegistration>) {
    const existing = this.providers.get(apiId);
    if (!existing) return null;
    const updated: ApiProviderRegistration = {
      ...existing,
      ...patch,
      structuralSignalOnly: true,
      fabricated: false,
      retryPolicy: patch.retryPolicy
        ? { ...patch.retryPolicy, retryOnStatuses: [...patch.retryPolicy.retryOnStatuses] }
        : { ...existing.retryPolicy, retryOnStatuses: [...existing.retryPolicy.retryOnStatuses] },
      timeoutPolicy: patch.timeoutPolicy
        ? { ...patch.timeoutPolicy }
        : { ...existing.timeoutPolicy },
    };
    this.providers.set(apiId, updated);
    this.auditTrail.push(`provider_updated:${apiId}@${new Date().toISOString()}`);
    return this.cloneProvider(updated);
  }

  saveConnection(connection: ApiConnection) {
    const snapshot = this.cloneConnection(connection);
    this.connections.set(connection.connectionId, snapshot);
    this.auditTrail.push(`connection_saved:${connection.connectionId}@${connection.openedAt}`);
    return snapshot;
  }

  getConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    return connection ? this.cloneConnection(connection) : null;
  }

  listConnections() {
    return [...this.connections.values()]
      .map((c) => this.cloneConnection(c))
      .sort((a, b) => a.connectionId.localeCompare(b.connectionId));
  }

  listActiveConnections() {
    return this.listConnections().filter(
      (c) => c.status === "connected" || c.status === "connecting" || c.status === "degraded",
    );
  }

  updateConnection(connectionId: string, patch: Partial<ApiConnection>) {
    const existing = this.connections.get(connectionId);
    if (!existing) return null;
    const updated: ApiConnection = {
      ...existing,
      ...patch,
      structuralSignalOnly: true,
      fabricated: false,
    };
    this.connections.set(connectionId, updated);
    this.auditTrail.push(`connection_updated:${connectionId}@${new Date().toISOString()}`);
    return this.cloneConnection(updated);
  }

  saveTrace(trace: ApiRequestTrace) {
    const snapshot = this.cloneTrace(trace);
    this.traces.push(snapshot);
    this.auditTrail.push(`trace_saved:${trace.requestId}@${trace.timestamp}`);
    return snapshot;
  }

  listTraces() {
    return this.traces.map((t) => this.cloneTrace(t));
  }

  listTracesForApi(apiId: string) {
    return this.listTraces().filter((t) => t.apiId === apiId);
  }

  saveReport(report: ApiRuntimeReport) {
    this.reports.push({
      ...report,
      registeredApis: report.registeredApis.map((p) => this.cloneProvider(p)),
      activeConnections: report.activeConnections.map((c) => this.cloneConnection(c)),
      providerHealth: report.providerHealth.map((h) => ({ ...h })),
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }

  getHistory() {
    return {
      providers: this.listProviders(),
      connections: this.listConnections(),
      traces: this.listTraces(),
      reports: this.listReports(),
    };
  }

  private cloneProvider(provider: ApiProviderRegistration): ApiProviderRegistration {
    return {
      ...provider,
      retryPolicy: {
        ...provider.retryPolicy,
        retryOnStatuses: [...provider.retryPolicy.retryOnStatuses],
      },
      timeoutPolicy: { ...provider.timeoutPolicy },
      structuralSignalOnly: true,
      fabricated: false,
    };
  }

  private cloneConnection(connection: ApiConnection): ApiConnection {
    return {
      ...connection,
      structuralSignalOnly: true,
      fabricated: false,
    };
  }

  private cloneTrace(trace: ApiRequestTrace): ApiRequestTrace {
    return {
      ...trace,
      fabricated: false,
      structuralSignalOnly: true,
      secretsExposed: false,
    };
  }
}
