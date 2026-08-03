import type { TestingWorkerEngine } from "./engine.js";
export class TestingManager { constructor(private readonly engine:TestingWorkerEngine){} async executeAndAnalyze(){const run=await this.engine.executeAll();return {run,coverage:this.engine.getCoverage({runId:run.runId}),regressions:this.engine.detectRegressions({runId:run.runId})}} }
