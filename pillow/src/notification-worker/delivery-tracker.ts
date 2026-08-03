import type { DeliveryRecord } from "./types.js";
export class DeliveryTracker {private values:DeliveryRecord[]=[];record(v:DeliveryRecord){this.values.push(v);return v}list(){return [...this.values]}}
