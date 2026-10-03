import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {getDatabase,resetDatabaseInstance} from '../../brain/database.js';
import {registerStrategicMemoryRoutes} from '../../foundation/strategic-memory-engine/routes/strategic-memory-routes.js';
import {getStrategicMemorySummary,listStrategicMemories} from '../../foundation/strategic-memory-engine/services/strategic-memory-engine-service.js';
import {resetStrategicMemoryRepository} from '../../foundation/strategic-memory-engine/repositories/sqlite-strategic-memory-repository.js';
import type {AuditLogger} from '../../brain/audit/audit-logger.js';

test('all strategic-memory inspection routes preserve empty stores and withhold foreign lifecycle',async()=>{
 const old=process.env.DATABASE_PATH;process.env.DATABASE_PATH=':memory:strategic-read';resetDatabaseInstance();resetStrategicMemoryRepository();
 const db=getDatabase();const app=Fastify();const audits:unknown[]=[];
 await registerStrategicMemoryRoutes(app,{authenticate:async(request)=>{request.user={id:'owner',email:'owner@example.test',name:'Owner',role:'founder',workspaceId:'mine'};},auditLogger:{write:(x:unknown)=>audits.push(x)} as unknown as AuditLogger});
 const snapshot=()=>JSON.stringify({schema:db.prepare('SELECT name,sql FROM sqlite_master ORDER BY name').all(),memories:db.prepare('SELECT * FROM strategic_memories ORDER BY memory_id').all(),lifecycle:db.prepare('SELECT * FROM strategic_memory_lifecycle ORDER BY lifecycle_id').all()});
 try{
 const before=snapshot();assert.deepEqual(listStrategicMemories('mine'),[]);assert.equal(getStrategicMemorySummary('mine').totalMemories,0);
 for(const url of ['/strategic-memory/memories','/strategic-memory/summary','/strategic-memory/lifecycle','/strategic-memory/memories/absent','/strategic-memory/lifecycle/absent'])await app.inject({url});
 assert.equal(snapshot(),before);assert.deepEqual(audits,[]);
 db.prepare('INSERT INTO strategic_memories (memory_id,workspace_id,category,status,memory_json,created_at,updated_at) VALUES (@id,@workspace,@category,@status,@json,@at,@at)').run({id:'foreign',workspace:'other',category:'failures',status:'ACTIVE',json:JSON.stringify({memoryId:'foreign',workspaceId:'other'}),at:'2026-10-03'});
 const foreignBefore=snapshot();const response=await app.inject({url:'/strategic-memory/lifecycle/foreign'});assert.equal(response.statusCode,404);assert.equal(snapshot(),foreignBefore);
 }finally{await app.close();resetDatabaseInstance();resetStrategicMemoryRepository();if(old===undefined)delete process.env.DATABASE_PATH;else process.env.DATABASE_PATH=old;}
});
