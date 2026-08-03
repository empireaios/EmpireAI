import type {
  ExecutivePerformanceReport,
  PerformanceRecord,
  PerformanceWorker,
} from "./types.js";

/** Authoritative in-memory Worker Performance Review store — evaluate only. */
export class PerformanceStore {
  private workers = new Map<string, PerformanceWorker>();
  private records: PerformanceRecord[] = [];
  private latestReviewId: string | null = null;
  private latestExecutiveReport: ExecutivePerformanceReport | null = null;

  seed(params: { workers: PerformanceWorker[]; records: PerformanceRecord[] }) {
    this.workers.clear();
    this.records = [];
    this.latestReviewId = null;
    this.latestExecutiveReport = null;
    for (const worker of params.workers) {
      this.workers.set(worker.workerId, cloneWorker(worker));
    }
    for (const record of params.records) {
      this.records.push(cloneRecord(record));
      this.latestReviewId = record.performanceReviewId;
    }
  }

  listWorkers() {
    return [...this.workers.values()]
      .sort((a, b) => a.workerId.localeCompare(b.workerId))
      .map(cloneWorker);
  }

  listActiveWorkers() {
    return this.listWorkers().filter((w) => w.active);
  }

  listRecords() {
    return this.records
      .slice()
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneRecord);
  }

  recordsFor(workerId: string) {
    return this.listRecords().filter((r) => r.workerId === workerId);
  }

  workerCount() {
    return this.workers.size;
  }

  recordCount() {
    return this.records.length;
  }

  getWorker(workerId: string) {
    const worker = this.workers.get(workerId);
    return worker ? cloneWorker(worker) : null;
  }

  getLatestReviewId() {
    return this.latestReviewId;
  }

  getLatestExecutiveReport() {
    return this.latestExecutiveReport ? cloneExecutive(this.latestExecutiveReport) : null;
  }

  upsertWorker(worker: PerformanceWorker) {
    this.workers.set(worker.workerId, cloneWorker(worker));
    return cloneWorker(worker);
  }

  saveRecord(record: PerformanceRecord) {
    this.records.push(cloneRecord(record));
    this.latestReviewId = record.performanceReviewId;
    return cloneRecord(record);
  }

  saveExecutiveReport(report: ExecutivePerformanceReport) {
    this.latestExecutiveReport = cloneExecutive(report);
    return cloneExecutive(report);
  }
}

function cloneWorker(worker: PerformanceWorker): PerformanceWorker {
  return {
    ...worker,
    metrics: { ...worker.metrics },
    neverExecuteWorkerTasks: true,
  };
}

function cloneRecord(record: PerformanceRecord): PerformanceRecord {
  return {
    ...record,
    improvementRecommendations: [...record.improvementRecommendations],
    metricScores: { ...record.metricScores },
    trend: { ...record.trend, notes: [...record.trend.notes] },
  };
}

function cloneExecutive(report: ExecutivePerformanceReport): ExecutivePerformanceReport {
  return {
    ...report,
    ratingDistribution: { ...report.ratingDistribution },
    improvingWorkers: [...report.improvingWorkers],
    decliningWorkers: [...report.decliningWorkers],
    topPerformers: [...report.topPerformers],
    improvementPriorities: [...report.improvementPriorities],
  };
}
