import assert from 'node:assert/strict';
import {test} from 'node:test';
import {GovernedCommerceStore,digest,type Receipt} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';
import {readOwnerPortfolio} from '../../runtime/commerce-runtime/governed/owner-portfolio.js';
test('1000-record isolated portfolio supports accurate server pagination, filters, sort and tenant isolation without writes',()=>{
 const store=new GovernedCommerceStore(':memory:');try{
 const now=Date.now(),scenario=acceptanceScenario('ws1','owner',now),engine=new GovernedCommerceEngine(store,()=>now);
 engine.execute(scenario.actors.PROPOSER!,{id:'seed',missionId:'seed',expectedVersion:0,command:scenario.steps[0]!.command});
 const template=store.history('ws1','seed')[0]!;
 store.transaction(()=>{for(let i=1;i<1000;i++){const r=JSON.parse(JSON.stringify(template)) as Receipt;r.id='row-'+i;r.missionId='row-'+i;const s=r.state as any;s.candidate.title='Product '+String(i).padStart(4,'0');s.candidate.offer.sku='sku-'+i;s.candidate.productId='product-'+i;s.candidate.category=i%2?'ODD':'EVEN';s.qualification.economics.contribution=i;const {digest:_,...body}=r;r.digest=digest(body);store.insert(r);}});
 const count=()=>Number(store.db.prepare('SELECT count(*) n FROM commerce_runtime_receipts').get()!.n);
 assert.equal(readOwnerPortfolio(store,'ws1',{}).total,0,'synthetic must not enter actual catalogue');
 const page=readOwnerPortfolio(store,'ws1',{classification:'SYNTHETIC',page:20,pageSize:50,sort:'title',direction:'asc'});
 assert.equal(page.total,1000);assert.equal(page.items.length,50);assert.equal(page.pages,20);assert.equal(page.activeCount,null);assert.equal(page.items[0]!.sales,null);
 const filtered=readOwnerPortfolio(store,'ws1',{classification:'SYNTHETIC',category:'ODD',search:'Product',sort:'contribution',direction:'desc'});assert.equal(filtered.total,500);assert.equal(filtered.items[0]!.title,'Product 0999');
 assert.equal(readOwnerPortfolio(store,'ws2',{classification:'ALL'}).total,0);
 assert.throws(()=>readOwnerPortfolio(store,'ws1',{pageSize:1000}));assert.throws(()=>readOwnerPortfolio(store,'ws1',{sort:'title;DROP TABLE'}));
 assert.equal(count(),1000,'projection does not mutate canonical journal');
 }finally{store.close();}
});
