import assert from 'node:assert/strict';
import {test} from 'node:test';
import {reconcilePillowHistory} from './reconcile-history';
import type {PillowConversationTurn as Turn} from '../cockpit/pillow/pillow-session-store';
const turn=(id:string,role:Turn['role'],content:string,seconds:number,requestId?:string):Turn=>({id,role,content,recordedAt:new Date(1790990000000+seconds*1000).toISOString(),requestId,screenPath:'/pillow'});
test('one identity renders the authoritative answer even with different archived content',()=>{
  const s=turn('s','pillow','saved answer',20,'pcr_1'),a=turn('a','pillow','pending receipt',19,'pcr_1');
  assert.deepEqual(reconcilePillowHistory([s],[a]),[s]);
});
test('legacy host/transport IDs reconcile through unique matching owner interaction',()=>{
  const server=[turn('su','grand-king','Explain the operating state.',1,'host_1'),turn('sa','pillow','Server failure record',20,'host_1')];
  const archive=[turn('au','grand-king','Explain the operating state.',0),turn('aa','pillow','Browser failure record',21,'pcr_1')];
  assert.deepEqual(reconcilePillowHistory(server,archive),server);
  assert.deepEqual(reconcilePillowHistory(server,archive),reconcilePillowHistory(server,archive));
});
test('same text in distinct interactions remains distinct',()=>{
  const server=[turn('su','grand-king','Hello',1,'h1'),turn('sa','pillow','Hello',2,'h1')];
  const archive=[turn('au','grand-king','Hello',10,'p2'),turn('aa','pillow','Hello',11,'p2')];
  assert.equal(reconcilePillowHistory(server,archive).length,4);
});
test('ambiguous legacy anchors and orphan archives are preserved',()=>{
  const server=[turn('u1','grand-king','Repeat',1,'h1'),turn('u2','grand-king','Repeat',2,'h2')];
  const archive=[turn('a1','grand-king','Repeat',1),turn('a2','pillow','Recovery evidence',3)];
  assert.equal(reconcilePillowHistory(server,archive).length,4);
  assert.deepEqual(reconcilePillowHistory([],archive),archive);
});
