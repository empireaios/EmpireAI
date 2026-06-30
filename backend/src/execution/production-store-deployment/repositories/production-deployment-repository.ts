import type { DeploymentLogEntry } from "../models/deployment-log-entry.js";
import type { ProductionDeploymentRecord } from "../models/production-deployment-record.js";

export interface ProductionDeploymentRepository {
  saveDeployment(record: ProductionDeploymentRecord): ProductionDeploymentRecord;
  getDeploymentById(deploymentId: string): ProductionDeploymentRecord | null;
  listDeployments(workspaceId: string, storeId?: string): ProductionDeploymentRecord[];
  getLatestDeployed(workspaceId: string, projectName: string): ProductionDeploymentRecord | null;

  appendLog(entry: DeploymentLogEntry): DeploymentLogEntry;
  listLogs(deploymentId: string): DeploymentLogEntry[];
}
