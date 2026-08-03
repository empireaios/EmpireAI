import type { ExecutionMemoryConfiguration } from "./configuration.js";
import { ExecutionMemoryCore } from "./execution-memory-core.js";
import type {
  EngineStatus,
  ExecutionMemoryRunReport,
  RetrieveMemoryInput,
  SearchMemoryInput,
  StoreMemoryInput,
  UpdateMemoryInput,
} from "./types.js";

export class ExecutionMemoryController {
  private status: EngineStatus = "idle";
  private latestReport: ExecutionMemoryRunReport | null = null;

  constructor(
    private readonly manager: ExecutionMemoryCore,
    private readonly config: ExecutionMemoryConfiguration,
  ) {}

  initialize() {
    this.status = "active";
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return { ...this.config };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  storeRecord(input: StoreMemoryInput) {
    this.status = "recording";
    return this.finish(this.manager.storeRecord(input, this.config));
  }

  retrieveRecord(input: RetrieveMemoryInput) {
    this.status = "retrieving";
    return this.finish(this.manager.retrieveRecord(input, this.config));
  }

  searchRecords(input: SearchMemoryInput = {}) {
    this.status = "searching";
    return this.finish(this.manager.searchRecords(input, this.config));
  }

  updateRecord(input: UpdateMemoryInput) {
    this.status = "recording";
    return this.finish(this.manager.updateRecord(input, this.config));
  }

  listRecords() {
    this.status = "retrieving";
    return this.finish(this.manager.listRecords(this.config));
  }

  validateRecords() {
    this.status = "active";
    return this.finish(this.manager.validateRecords(this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ExecutionMemoryRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
