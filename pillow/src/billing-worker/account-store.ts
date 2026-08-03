import type { BillingAccount } from "./types.js";
export class AccountStore { private readonly records = new Map<string,BillingAccount>(); add(value:BillingAccount){ this.records.set(value.accountId,value); return value; } get(id:string){return this.records.get(id)??null;} list(){return [...this.records.values()];} }
