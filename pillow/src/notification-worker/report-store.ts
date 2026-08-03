import type { NotificationBuildReport } from "./types.js";
export class ReportStore {private values:NotificationBuildReport[]=[];save(v:NotificationBuildReport){this.values.push(v);return v}list(){return [...this.values]}latest(){return this.values.at(-1)??null}}
