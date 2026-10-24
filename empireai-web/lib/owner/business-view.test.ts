import test from 'node:test';
import assert from 'node:assert/strict';
import {operationalAmounts,providerAmounts,periodBounds,evidenceMatches,actualCosts,sumKnown} from './business-view';
const cost=(category:string,sgdMicro:number|null,extra={})=>({id:category,sgdMicro,data:{category,authenticity:'REAL',stage:'INVOICED',provider:'openai',periodStart:'2026-10-01T00:00:00Z',periodEnd:'2026-11-01T00:00:00Z',attribution:{orderId:'order-1'},...extra}});
test('Operational profit excludes infrastructure, receivables, forecasts and test history',()=>{
 const source=[cost('REVENUE',100),cost('COGS',30),cost('FEES',5),cost('TECHNOLOGY',80),cost('RECEIVABLE',700),cost('REVENUE',900,{authenticity:'SYNTHETIC'}),cost('COGS',40,{stage:'ESTIMATED'})];
 const before=JSON.stringify(source),v=operationalAmounts(source);
 assert.deepEqual([v.revenue,v.costs,v.profit],[100,35,65]);assert.equal(v.entries.length,3);assert.equal(JSON.stringify(source),before);
});
test('Absent records and unknown FX do not become zero or a profit',()=>{
 assert.equal(operationalAmounts([]).profit,null);assert.equal(sumKnown([]),null);
 assert.equal(operationalAmounts([cost('REVENUE',100),cost('COGS',null)]).profit,null);
 assert.equal(operationalAmounts([cost('REVENUE',0),cost('COGS',0)]).profit,0);
 assert.equal(actualCosts([cost('COGS',99,{authenticity:'HISTORICAL_FIXTURE'})]).length,0);
});
test('Provider totals include confirmed infrastructure only, retaining other stages separately',()=>{
 const all=[cost('TECHNOLOGY',10),cost('TECHNOLOGY',20,{stage:'ACCRUED_UNBILLED'}),cost('COGS',80),cost('TECHNOLOGY',50,{authenticity:'SYNTHETIC'})];
 const v=providerAmounts(all,'openai',{from:'2026-10-01',to:'2026-11-01'});assert.equal(v.amount,10);assert.equal(v.entries.length,2);
});
test('Singapore periods and exact evidence identity are preserved',()=>{
 const bounds=periodBounds('MTD',new Date('2026-10-01T00:30:00+08:00'));assert.equal(bounds.from,'2026-09-30T16:00:00.000Z');
 assert.equal(evidenceMatches({id:'a'},{evidence:[{}]}),false);
 assert.equal(evidenceMatches({id:'a',digest:'h'},{evidence:[{id:'b',hash:'h'}]}),true);
 assert.equal(evidenceMatches({id:'a',observedAt:'same'},{evidence:[{id:'b',observedAt:'same'}]}),false);
});
