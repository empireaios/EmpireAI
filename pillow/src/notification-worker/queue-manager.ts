import type { QueueJob } from "./types.js";
export class QueueManager {private jobs=new Map<string,QueueJob>();save(job:QueueJob){this.jobs.set(job.jobId,job);return job}list(){return [...this.jobs.values()]}due(now=new Date()){return this.list().filter(x=>["queued","retrying","scheduled"].includes(x.status)&&new Date(x.availableAt)<=now)}}
