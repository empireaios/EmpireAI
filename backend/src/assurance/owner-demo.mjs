import {DatabaseSync} from 'node:sqlite';
// Fixed isolated demonstration namespace. No business, reasoning or accounting writes.
function open(filename){const db=new DatabaseSync(filename,{timeout:1000,allowExtension:false});db.exec(`CREATE TABLE IF NOT EXISTS assurance_demo_source(id INTEGER PRIMARY KEY CHECK(id=1),expected INTEGER NOT NULL,actual INTEGER NOT NULL,changed_at INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS assurance_demo_observations(id INTEGER PRIMARY KEY,observed_at INTEGER NOT NULL,status TEXT NOT NULL,source_changed_at INTEGER NOT NULL);`);return db;}
export function changeDemo(filename,action,now=Date.now()){
 if(!['inject','correct'].includes(action))throw Error('Invalid demonstration action');
 const db=open(filename);try{db.prepare('INSERT INTO assurance_demo_source VALUES(1,1,?,?) ON CONFLICT(id) DO UPDATE SET actual=excluded.actual,changed_at=excluded.changed_at').run(action==='inject'?0:1,now);return {accepted:true,scope:'isolated_demonstration',action,changedAt:now,awaitingIndependentObservation:true};}finally{db.close();}
}
export function observeDemo(filename,now=Date.now()){
 const db=open(filename);try{
 db.prepare('INSERT OR IGNORE INTO assurance_demo_source VALUES(1,1,1,?)').run(now);
 const row=db.prepare('SELECT * FROM assurance_demo_source WHERE id=1').get(),status=row.expected===row.actual?'HEALTHY':'DEGRADED';
 const prior=db.prepare('SELECT * FROM assurance_demo_observations ORDER BY id DESC LIMIT 1').get();
 if(!prior||prior.status!==status||prior.source_changed_at!==row.changed_at)db.prepare('INSERT INTO assurance_demo_observations(observed_at,status,source_changed_at) VALUES(?,?,?)').run(now,status,row.changed_at);
 }finally{db.close();}
}
export function readDemo(filename){const db=new DatabaseSync(filename,{readOnly:true,timeout:1000});try{return {scope:'Isolated production demonstration; does not certify commerce',history:db.prepare('SELECT observed_at AS observedAt,status,source_changed_at AS sourceChangedAt FROM assurance_demo_observations ORDER BY id DESC LIMIT 20').all()};}finally{db.close();}}
