import type { CaseResult,TestRun } from "./types.js";
export class RunStore { private runs=new Map<string,TestRun>();save(run:TestRun){this.runs.set(run.runId,run);return run}get(runId:string){return this.runs.get(runId)}list(){return [...this.runs.values()]}results(runId?:string):CaseResult[]{return runId?this.get(runId)?.results??[]:this.list().flatMap(x=>x.results)} }
