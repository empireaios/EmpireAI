import type { Subscription } from "./types.js";
export class SubscriptionStore { private readonly records=new Map<string,Subscription>(); add(value:Subscription){this.records.set(value.subscriptionId,value);return value;} get(id:string){return this.records.get(id)??null;} list(){return [...this.records.values()];} }
