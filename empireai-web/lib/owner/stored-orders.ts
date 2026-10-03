export type StoredOrder={orderId:string;marketplaceId:string;lastUpdatedTime:string;fulfillmentStatus:string|null;sourceSha256:string;grandTotalCents:number|null};
export type StoredOrders={orders:StoredOrder[];importStatus:{status:string;lastCompletedAt:string|null;pagesPending:boolean}|null};
export function parseStoredOrders(value:unknown):StoredOrders{
 if(!value||typeof value!=='object')throw Error('Stored order evidence unavailable');
 const v=value as Record<string,unknown>;
 if(v.providerId!=='amazon-us'||v.commerceEffect!=='none'||!Array.isArray(v.orders)||v.orders.length>100)throw Error('Stored order evidence invalid');
 const ids=new Set<string>();
 const orders=v.orders.map((r:StoredOrder)=>{
  if(!r||typeof r.orderId!=='string'||!r.orderId||ids.has(r.orderId)||typeof r.marketplaceId!=='string'||!Number.isFinite(Date.parse(r.lastUpdatedTime))||typeof r.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.sourceSha256)||(r.fulfillmentStatus!==null&&typeof r.fulfillmentStatus!=='string')||(r.grandTotalCents!==null&&(!Number.isSafeInteger(r.grandTotalCents)||r.grandTotalCents<0)))throw Error('Stored order evidence invalid');
  ids.add(r.orderId);
  return {orderId:r.orderId,marketplaceId:r.marketplaceId,lastUpdatedTime:r.lastUpdatedTime,fulfillmentStatus:r.fulfillmentStatus,sourceSha256:r.sourceSha256,grandTotalCents:r.grandTotalCents};
 });
 const s=v.importStatus as StoredOrders['importStatus'];
 if(s!==null&&(!s||typeof s.status!=='string'||typeof s.pagesPending!=='boolean'||(s.lastCompletedAt!==null&&!Number.isFinite(Date.parse(s.lastCompletedAt)))))throw Error('Import status invalid');
 return {orders,importStatus:s};
}
