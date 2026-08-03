import type { SubscriptionPlan } from "./types.js";
export class PlanStore { private readonly records = new Map<string,SubscriptionPlan>(); add(value:SubscriptionPlan){this.records.set(value.planId,value);return value;} get(id:string){return this.records.get(id)??null;} list(){return [...this.records.values()];} }
