import type {
  ToolConnection,
  ToolInvocationTrace,
  ToolRegistration,
  ToolRuntimeReport,
} from "./types.js";

let sequence = 0;

export function resetToolrtSequenceForTesting() {
  sequence = 0;
}

export function nextToolrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

export class ToolStore {
  private tools = new Map<string, ToolRegistration>();
  private connections = new Map<string, ToolConnection>();
  private invocations: ToolInvocationTrace[] = [];
  private reports: ToolRuntimeReport[] = [];
  private auditTrail: string[] = [];

  saveTool(tool: ToolRegistration) {
    const snapshot = this.cloneTool(tool);
    this.tools.set(tool.toolId, snapshot);
    this.auditTrail.push(`tool_saved:${tool.toolId}@${new Date().toISOString()}`);
    return snapshot;
  }

  getTool(toolId: string) {
    const tool = this.tools.get(toolId);
    return tool ? this.cloneTool(tool) : null;
  }

  listTools() {
    return [...this.tools.values()]
      .map((t) => this.cloneTool(t))
      .sort((a, b) => a.toolId.localeCompare(b.toolId));
  }

  updateTool(toolId: string, patch: Partial<ToolRegistration>) {
    const existing = this.tools.get(toolId);
    if (!existing) return null;
    const updated: ToolRegistration = {
      ...existing,
      ...patch,
      permissionPolicy: patch.permissionPolicy
        ? {
            ...patch.permissionPolicy,
            allowedActions: [...patch.permissionPolicy.allowedActions],
          }
        : {
            ...existing.permissionPolicy,
            allowedActions: [...existing.permissionPolicy.allowedActions],
          },
      structuralSignalOnly: true,
      fabricated: false,
    };
    this.tools.set(toolId, updated);
    this.auditTrail.push(`tool_updated:${toolId}@${new Date().toISOString()}`);
    return this.cloneTool(updated);
  }

  saveConnection(connection: ToolConnection) {
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

  updateConnection(connectionId: string, patch: Partial<ToolConnection>) {
    const existing = this.connections.get(connectionId);
    if (!existing) return null;
    const updated: ToolConnection = {
      ...existing,
      ...patch,
      structuralSignalOnly: true,
      fabricated: false,
    };
    this.connections.set(connectionId, updated);
    this.auditTrail.push(`connection_updated:${connectionId}@${new Date().toISOString()}`);
    return this.cloneConnection(updated);
  }

  saveInvocation(invocation: ToolInvocationTrace) {
    const snapshot = this.cloneInvocation(invocation);
    this.invocations.push(snapshot);
    this.auditTrail.push(`invocation_saved:${invocation.invocationId}@${invocation.timestamp}`);
    return snapshot;
  }

  listInvocations() {
    return this.invocations.map((i) => this.cloneInvocation(i));
  }

  listInvocationsForTool(toolId: string) {
    return this.listInvocations().filter((i) => i.toolId === toolId);
  }

  saveReport(report: ToolRuntimeReport) {
    this.reports.push({
      ...report,
      registeredTools: report.registeredTools.map((t) => this.cloneTool(t)),
      toolCategories: [...report.toolCategories],
      activeConnections: report.activeConnections.map((c) => this.cloneConnection(c)),
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
      tools: this.listTools(),
      connections: this.listConnections(),
      invocations: this.listInvocations(),
      reports: this.listReports(),
    };
  }

  private cloneTool(tool: ToolRegistration): ToolRegistration {
    return {
      ...tool,
      permissionPolicy: {
        ...tool.permissionPolicy,
        allowedActions: [...tool.permissionPolicy.allowedActions],
      },
      structuralSignalOnly: true,
      fabricated: false,
    };
  }

  private cloneConnection(connection: ToolConnection): ToolConnection {
    return {
      ...connection,
      structuralSignalOnly: true,
      fabricated: false,
    };
  }

  private cloneInvocation(invocation: ToolInvocationTrace): ToolInvocationTrace {
    return {
      ...invocation,
      fabricated: false,
      structuralSignalOnly: true,
      secretsExposed: false,
    };
  }
}
