import type { FailureEvidence } from "./types.js";
export class FailureRecorder { private values:FailureEvidence[]=[];record(value:FailureEvidence){this.values.push(value);return value}list(runId?:string){return this.values.filter(x=>!runId||x.runId===runId)} }
