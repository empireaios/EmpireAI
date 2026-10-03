import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseStoredOrders} from './stored-orders';
const row={orderId:'order-1',marketplaceId:'ATVPDKIKX0DER',lastUpdatedTime:'2026-10-03T10:00:00Z',fulfillmentStatus:'SHIPPED',sourceSha256:'a'.repeat(64),grandTotalCents:null};
const value={providerId:'amazon-us',commerceEffect:'none',orders:[row],importStatus:null};
test('unknown economics and absent import proof remain unknown; extra private fields are excluded',()=>{
 const result=parseStoredOrders({...value,orders:[{...row,customerEmail:'private@example.test'}]});
 assert.equal(result.orders[0].grandTotalCents,null);assert.equal(result.importStatus,null);assert.equal('customerEmail' in result.orders[0],false);
});
test('duplicate identities, malformed receipts and ambiguous financial amounts fail closed',()=>{
 for(const orders of [[row,row],[{...row,sourceSha256:''}],[{...row,grandTotalCents:'0'}],[{...row,grandTotalCents:-1}],[{...row,lastUpdatedTime:'invalid'}]])assert.throws(()=>parseStoredOrders({...value,orders}));
 assert.throws(()=>parseStoredOrders({...value,providerId:'sandbox'}));
});
