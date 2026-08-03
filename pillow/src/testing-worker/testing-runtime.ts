import type { TestingWorkerEngine } from "./engine.js";
export class TestingRuntime { constructor(private readonly engine:TestingWorkerEngine){} async executeAll(){return this.engine.executeAll()} analyze(runId?:string){return {coverage:this.engine.getCoverage({runId}),regressions:this.engine.detectRegressions({runId})}} }
