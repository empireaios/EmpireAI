import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {readCanonicalSqlite,compareCanonical} from './hh4-inspection-restoration.mjs';
const envelope=stores=>({stores,json:{},redis:[],markers:{},sessionRetention:{}});
test('actual finance schema readback retains row order lineage, integer precision, blobs and internal sequence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hh4-reader-')),file=path.join(dir,'state.db');const db=new DatabaseSync(file);
 try{db.exec('CREATE TABLE financial_evidence(workspace TEXT NOT NULL,id TEXT NOT NULL,digest TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,id));CREATE TABLE typed(id INTEGER PRIMARY KEY AUTOINCREMENT,n INTEGER,b BLOB,r REAL);');
 db.prepare('INSERT INTO financial_evidence VALUES(?,?,?,?)').run('synthetic','one','digest',JSON.stringify({authenticity:'SYNTHETIC',amountMicro:1}));db.prepare('INSERT INTO typed(n,b,r) VALUES(?,?,?)').run(9223372036854775807n,Buffer.from([0,255]),1.25);
 const a=readCanonicalSqlite(file);assert.ok(a.tables.sqlite_sequence);const typed=JSON.stringify(a.tables.typed);assert.match(typed,/9223372036854775807/);assert.match(typed,/AP8=/);assert.match(typed,/1.25/);
 db.exec('UPDATE financial_evidence SET rowid=9');const b=readCanonicalSqlite(file);assert.throws(()=>compareCanonical(envelope(a),envelope(b)),/CANONICAL_RESTORATION_MISMATCH/);
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('canonical comparison refuses finance, session TTL, marker or JSON changes without normalization',()=>{
 const a={stores:{finance:'record'},json:{authority:{grant:false}},redis:[{key:'s',dump:'bytes',ttl:10}],markers:{commerce:'bytes'},sessionRetention:{binaryKeyDumpAndTtl:[{ttl:10}]}};
 assert.equal(compareCanonical(a,structuredClone(a)).equal,true);
 for(const section of Object.keys(a)){const b=structuredClone(a);b[section]={changed:true};assert.throws(()=>compareCanonical(a,b),/CANONICAL_RESTORATION_MISMATCH/);}
});

test('generated rowid-alias columns cannot hide physical row lineage',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hh4-generated-reader-')),file=path.join(dir,'state.db');const db=new DatabaseSync(file);
 try{db.exec('CREATE TABLE generated_alias(value INTEGER, __inspection_rowid__ INTEGER GENERATED ALWAYS AS (value+1), rowid INTEGER GENERATED ALWAYS AS (value+2));INSERT INTO generated_alias(value) VALUES(7);CREATE TABLE "__proto__"(v TEXT);INSERT INTO "__proto__" VALUES(1);');
  const a=readCanonicalSqlite(file);assert.ok(Object.hasOwn(a.tables,'__proto__'));db.exec('UPDATE generated_alias SET _rowid_=23');const b=readCanonicalSqlite(file);
  assert.throws(()=>compareCanonical(envelope(a),envelope(b)),/CANONICAL_RESTORATION_MISMATCH/);
 }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
});
