import assert from 'node:assert/strict';
import {test,afterEach} from 'node:test';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {closeDatabase,getDatabase,resetDatabaseInstance} from '../../brain/database.js';
import {amazonSgSpApiAdapter,amazonUsSpApiAdapter} from '../../orchestration/reality-integration/live-commerce/adapters/amazon-sp-api-adapter.js';
import {listImportedAmazonOrders,getAmazonOrderImportStatus} from '../../orchestration/reality-integration/live-commerce/adapters/amazon-order-import.js';
import {listCurrentAmazonListings,nextPendingAmazonListingsImport,pauseAmazonListingsImport,getAmazonListingsImportStatus} from '../../orchestration/reality-integration/live-commerce/adapters/amazon-listings-import.js';
import {listCurrentAmazonSellerInventory,nextPendingAmazonSellerInventoryImport,pauseAmazonSellerInventoryImport,getAmazonSellerInventoryImportStatus} from '../../orchestration/reality-integration/live-commerce/adapters/amazon-seller-inventory-import.js';
import {setHttpTransportOverride,resetHttpTransportOverride} from '../../orchestration/reality-integration/live-commerce/http-transport.js';
const saved=process.env.DATABASE_PATH;
let dir:string|undefined;
const sg={workspaceId:'ws_sg_proof',providerId:'amazon-sg',mode:'production' as const,credentials:{accessToken:'offline-sg-token',sellerId:'SELLER_SG'}};
const market='A19VAU5U5O7RUS';
function setup(){dir=mkdtempSync(join(tmpdir(),'amazon-sg-'));process.env.DATABASE_PATH=join(dir,'brain.db');resetDatabaseInstance();}
afterEach(()=>{resetHttpTransportOverride();resetDatabaseInstance();if(dir)rmSync(dir,{recursive:true,force:true});dir=undefined;if(saved===undefined)delete process.env.DATABASE_PATH;else process.env.DATABASE_PATH=saved;});
function order(currency='SGD',marketplaceId=market){return {orderId:'sg-order-1',salesChannel:{marketplaceId},createdTime:'2026-09-20T00:00:00Z',lastUpdatedTime:'2026-09-21T00:00:00Z',orderItems:[{orderItemId:'item1',quantityOrdered:2,product:{sellerSku:'SKU1'}}],proceeds:{grandTotal:{currencyCode:currency,amount:'32.15'}},buyer:{email:'private-buyer@example.test'}};}
function listing(currency='SGD',marketplaceId=market){return {sku:'SKU1',summaries:[{marketplaceId,asin:'B000000001',itemName:'Fixture',status:['BUYABLE']}],offers:[{marketplaceId,offerType:'B2C',price:{currency,amount:'12.34'}}],fulfillmentAvailability:[{fulfillmentChannelCode:'DEFAULT',marketplaceId,quantity:3}]};}
function assertRead(request:{url:string;method:string;headers?:Record<string,string>}){const url=new URL(request.url);assert.equal(request.method,'GET');assert.equal(url.origin,'https://sellingpartnerapi-fe.amazon.com');assert.equal(url.searchParams.get('marketplaceIds'),market);assert.equal(request.headers?.['x-amz-access-token'],'offline-sg-token');return url;}
test('SG order pagination retains SGD and regional identity across disk reopen; duplicates upsert once',async()=>{
 setup();let calls=0;let first:URL;
 setHttpTransportOverride(async request=>{const url=assertRead(request);calls++;if(calls===1)first=url;else {assert.equal(url.searchParams.get('paginationToken'),'sg-page-2');assert.equal(url.searchParams.get('lastUpdatedAfter'),first.searchParams.get('lastUpdatedAfter'));}return {ok:true,status:200,latencyMs:1,json:{orders:[order()],...(calls===1?{pagination:{nextToken:'sg-page-2'}}:{})}};});
 await assert.rejects(amazonSgSpApiAdapter.syncOrders(sg),/PAGINATION_PENDING/);closeDatabase();
 assert.equal(getAmazonOrderImportStatus(sg.workspaceId,'amazon-sg')?.status,'pending');
 await assert.rejects(amazonSgSpApiAdapter.syncOrders(sg),/RATE_LIMIT_PENDING/);assert.equal(calls,1);
 getDatabase().prepare("UPDATE amazon_order_request_gate SET next_allowed_at='2000-01-01T00:00:00Z' WHERE provider_id='amazon-sg'").run();await getDatabase().requestCriticalPersist();closeDatabase();
 const receipt=await amazonSgSpApiAdapter.syncOrders(sg);assert.equal(receipt.durableReadbackVerified,true);closeDatabase();
 const rows=listImportedAmazonOrders(sg.workspaceId,'amazon-sg');assert.equal(rows.length,1);assert.equal(rows[0]?.grandTotalCents,3215);assert.equal(rows[0]?.grandTotalCurrency,'SGD');assert.equal(rows[0]?.marketplaceId,market);
 assert.equal(listImportedAmazonOrders(sg.workspaceId,'amazon-us').length,0);assert.doesNotMatch(JSON.stringify(rows),/private-buyer/);
});
for(const [currency,marketplaceId]of [['USD',market],['SGD','ATVPDKIKX0DER']] as const)test(`SG rejects order currency/marketplace mismatch ${currency}/${marketplaceId}`,async()=>{
 setup();setHttpTransportOverride(async request=>{assertRead(request);return {ok:true,status:200,latencyMs:1,json:{orders:[order(currency,marketplaceId)]}};});
 await assert.rejects(amazonSgSpApiAdapter.syncOrders(sg),/currency or amount unsupported|marketplace or timestamps invalid/);assert.equal(listImportedAmazonOrders(sg.workspaceId,'amazon-sg').length,0);
});
test('SG listing and seller stock cursors retain their marketplace through recovery and pause',async()=>{
 setup();setHttpTransportOverride(async request=>{const url=assertRead(request);assert.equal(url.pathname,'/listings/2021-08-01/items/SELLER_SG');return {ok:true,status:200,latencyMs:1,json:{items:[listing()],pagination:{nextToken:'private-next'}}};});
 await assert.rejects(amazonSgSpApiAdapter.syncCatalog(sg),/PAGINATION_PENDING/);
 await assert.rejects(amazonSgSpApiAdapter.syncInventory(sg),/PAGINATION_PENDING/);closeDatabase();
 const rows=listCurrentAmazonListings(sg.workspaceId,'amazon-sg');assert.equal(rows[0]?.sellerOfferCurrency,'SGD');assert.equal(rows[0]?.sellerOfferPriceCents,1234);assert.equal(listCurrentAmazonListings(sg.workspaceId,'amazon-us').length,0);
 assert.equal(listCurrentAmazonSellerInventory(sg.workspaceId,'amazon-sg')[0]?.sellerFulfilledQuantity,3);assert.equal(listCurrentAmazonSellerInventory(sg.workspaceId,'amazon-us').length,0);
 const listings=nextPendingAmazonListingsImport(),inventory=nextPendingAmazonSellerInventoryImport();assert.equal(listings?.providerId,'amazon-sg');assert.equal(inventory?.providerId,'amazon-sg');
 await pauseAmazonListingsImport(sg.workspaceId,'PROVIDER_FAILURE',listings!.startedAt,'amazon-sg');await pauseAmazonSellerInventoryImport(sg.workspaceId,'PROVIDER_FAILURE',inventory!.startedAt,'amazon-sg');closeDatabase();
 assert.equal(getAmazonListingsImportStatus(sg.workspaceId,'amazon-sg')?.status,'paused');assert.equal(getAmazonSellerInventoryImportStatus(sg.workspaceId,'amazon-sg')?.status,'paused');assert.equal(nextPendingAmazonListingsImport(),null);assert.equal(nextPendingAmazonSellerInventoryImport(),null);
});
test('SG listing rejects USD and adapters reject a mismatched marketplace context before network',async()=>{
 setup();let calls=0;setHttpTransportOverride(async request=>{calls++;assertRead(request);return {ok:true,status:200,latencyMs:1,json:{items:[listing('USD')]}};});
 await assert.rejects(amazonSgSpApiAdapter.syncCatalog(sg),/SGD price invalid/);assert.equal(listCurrentAmazonListings(sg.workspaceId,'amazon-sg').length,0);
 for(const run of [amazonUsSpApiAdapter.syncOrders,amazonUsSpApiAdapter.syncCatalog,amazonUsSpApiAdapter.syncInventory])await assert.rejects(run(sg),/marketplace mismatch/);assert.equal(calls,1);
});
