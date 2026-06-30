import type { KpiLifecycleRecord, KpiMetric, KpiObservation } from "../models/kpi-metric.js";

export interface KpiRepository {
  saveMetric(metric: KpiMetric): KpiMetric;
  getMetricById(kpiId: string): KpiMetric | null;
  getMetricByKey(workspaceId: string, metricKey: string): KpiMetric | null;
  listMetrics(workspaceId: string): KpiMetric[];

  appendObservation(observation: KpiObservation): KpiObservation;
  listObservations(kpiId: string, limit?: number): KpiObservation[];
  listWorkspaceObservations(workspaceId: string, limit?: number): KpiObservation[];

  appendLifecycle(record: KpiLifecycleRecord): KpiLifecycleRecord;
  listLifecycle(kpiId: string, limit?: number): KpiLifecycleRecord[];
  listWorkspaceLifecycle(workspaceId: string, limit?: number): KpiLifecycleRecord[];
}
