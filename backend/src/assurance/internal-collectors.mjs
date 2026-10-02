import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';

export function createWorkerCollector({origin,fetchImpl=fetch,clock=Date.now}){
  const target=new URL(origin);if(target.protocol!=='https:'||target.username||target.password)throw Error('Invalid source');
  return async signal=>{
    const r=await fetchImpl(target.origin+'/health/ready',{signal,redirect:'error'});
    if(!r.ok)throw Error('Readiness unavailable');
    const raw=await r.text();if(raw.length>32768)throw Error('Readiness exceeds bound');const s=JSON.parse(raw),now=clock();
    return {origin:'independent-adapter',source:'independent worker/Redis readiness read',evidenceId:'workers-'+now,observedAt:now,
      authoritative:[{id:'worker-ready',value:true},{id:'redis-ready',value:true}],
      internal:[{id:'worker-ready',value:s.workerReady===true},{id:'redis-ready',value:s.checks?.redis?.ok===true}]};
  };
}
export function createInspectorCollector(filename,clock=Date.now){
  return async()=>{
    const stat=fs.lstatSync(filename);if(!stat.isFile()||stat.size>1024||fs.realpathSync(filename)!==filename)throw Error('Inspector source invalid');
    const h=JSON.parse(fs.readFileSync(filename,'utf8')),now=clock();
    if(!Number.isSafeInteger(h.observedAt)||h.observedAt>now)throw Error('Inspector clock invalid');
    return {origin:'independent-adapter',source:'separate inspector heartbeat',evidenceId:'inspector-'+now,observedAt:h.observedAt,
      authoritative:[{id:'inspector-fresh',value:true}],internal:[{id:'inspector-fresh',value:now-h.observedAt<=90000}]};
  };
}
export function createSpendingCollector(filename,store,clock=Date.now){
  store.db.exec('CREATE TABLE IF NOT EXISTS assurance_ledger_baseline(id TEXT PRIMARY KEY,digest TEXT NOT NULL)');
  return async()=>{
    const stat=fs.lstatSync(filename);if(!stat.isFile()||stat.nlink!==1||stat.size>16*1024*1024||fs.realpathSync(filename)!==filename||!fs.existsSync(filename+'.initialized'))throw Error('Ledger unavailable');
    const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:100});let rows;
    try{
      db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
      if(db.prepare('PRAGMA application_id').get()?.application_id!==1162430793||db.prepare('PRAGMA user_version').get()?.user_version!==1||db.prepare('PRAGMA quick_check').get()?.quick_check!=='ok')throw Error('Ledger invalid');
      rows=db.prepare('SELECT id,timestamp,reserved_micro_usd,estimated_micro_usd FROM calls ORDER BY id LIMIT 10001').all();
      if(rows.length>10000)throw Error('Ledger exceeds bound');db.exec('COMMIT');
    }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
    let held=0;const observed=new Map();
    for(const row of rows){
      if(!Number.isSafeInteger(row.reserved_micro_usd)||row.reserved_micro_usd<=0||(row.estimated_micro_usd!==null&&(!Number.isSafeInteger(row.estimated_micro_usd)||row.estimated_micro_usd<0||row.estimated_micro_usd>row.reserved_micro_usd)))throw Error('Ledger quantity invalid');
      held+=row.reserved_micro_usd;observed.set(row.id,createHash('sha256').update(JSON.stringify([row.id,row.timestamp,row.reserved_micro_usd])).digest('hex'));
    }
    if(!Number.isSafeInteger(held))throw Error('Ledger sum invalid');
    const prior=store.db.prepare('SELECT id,digest FROM assurance_ledger_baseline').all();
    const unchanged=prior.every(r=>observed.get(r.id)===r.digest),within=held<=40000000;
    // Never replace a baseline after a discrepancy. New reservations are append-only.
    if(unchanged&&within){const insert=store.db.prepare('INSERT OR IGNORE INTO assurance_ledger_baseline VALUES(?,?)');store.db.exec('BEGIN');try{for(const [id,digest]of observed)insert.run(id,digest);store.db.exec('COMMIT');}catch(e){store.db.exec('ROLLBACK');throw e;}}
    const now=clock();return {origin:'independent-adapter',source:'read-only commissioning ledger versus independent retained reservation baseline; invoice amounts not verified',evidenceId:'spending-'+now,observedAt:now,
      authoritative:[{id:'ceiling-respected',value:true},{id:'prior-reservations-preserved',value:true}],
      internal:[{id:'ceiling-respected',value:within},{id:'prior-reservations-preserved',value:unchanged}]};
  };
}
