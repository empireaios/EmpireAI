export type Accounting={ceilingMicroUsd:number;heldMicroUsd:number;remainingMicroUsd:number;recordedEstimateMicroUsd:number;invoiceActualMicroUsd:number|null;invoiceUnknownCount:number;observedAt:string};
export function parseAccounting(value:unknown):Accounting{
 if(!value||typeof value!=='object')throw Error();const a=value as Record<string,unknown>;
 for(const key of ['ceilingMicroUsd','heldMicroUsd','remainingMicroUsd','recordedEstimateMicroUsd','invoiceUnknownCount'])if(!Number.isSafeInteger(a[key])||(a[key] as number)<0)throw Error();
 if(a.invoiceActualMicroUsd!==null&&(!Number.isSafeInteger(a.invoiceActualMicroUsd)||(a.invoiceActualMicroUsd as number)<0))throw Error();
 if((a.invoiceUnknownCount as number)>0&&a.invoiceActualMicroUsd!==null)throw Error();
 if(typeof a.observedAt!=='string'||!Number.isFinite(Date.parse(a.observedAt)))throw Error();return a as Accounting;
}
