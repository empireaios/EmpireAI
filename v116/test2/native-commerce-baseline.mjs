import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const baselineDigest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function commerceState(db){return {schema:db.prepare('SELECT name,type,sql FROM sqlite_master ORDER BY type,name').all().map(r=>({...r})),tables:Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(({name})=>[name,db.prepare('SELECT * FROM "'+name.replaceAll('"','""')+'"').all().map(r=>({...r})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]))};}
/** Exact native startup metadata only. No arbitrary metadata or business exemption. */
export function assertBootstrapRows(state,{enrolledAt=0,observedAt=Date.now(),requireEnrollment=true}={}){
 const tables=state.tables;if(requireEnrollment){assert.ok(Object.hasOwn(tables,'work8_recovery_checkpoints'),'NATIVE_EMPTY_RECOVERY_ENROLLMENT_REQUIRED');assert.equal(tables.work8_recovery_checkpoints.length,0,'BASELINE_ALREADY_REPLAYED');}
 assert.deepEqual(Object.entries(tables).filter(([,rows])=>rows.length).map(([name])=>name),['work8_fulfilment_scan','work8_sim_finance_cursor'],'UNEXPECTED_BOOTSTRAP_ROWS');
 assert.deepEqual(tables.work8_sim_finance_cursor,[{workspace:'probe:ws_empire_1',mission:''}],'EXACT_NATIVE_EMPTY_FINANCE_PROBE_CURSOR_REQUIRED');
 assert.equal(tables.work8_fulfilment_scan.length,1);const row=tables.work8_fulfilment_scan[0];assert.deepEqual(Object.keys(row),['workspace','record']);assert.equal(row.workspace,'ws_empire_1');const scan=JSON.parse(row.record);
 assert.deepEqual(Object.keys(scan),['after','startedAt','blocked','completedAt','watermark']);assert.deepEqual({...scan,startedAt:0,completedAt:0},{after:'',startedAt:0,blocked:false,completedAt:0,watermark:0});assert.ok(Number.isSafeInteger(scan.startedAt)&&scan.startedAt>=enrolledAt&&scan.startedAt<=observedAt);assert.equal(scan.startedAt,scan.completedAt,'NATIVE_EMPTY_SCAN_TIME_BINDING');
 return {classification:'EXACT_NATIVE_DERIVED_BOOTSTRAP_ONLY',allBusinessAuthorityTablesEmpty:true,enrollmentMarkerEmpty:requireEnrollment,financeCursor:tables.work8_sim_finance_cursor,fulfilmentScan:tables.work8_fulfilment_scan,fullStateSHA256:baselineDigest(state)};
}
export function assertBaselineExact(actual,expected){assert.deepEqual(actual,expected,'FULL_BOOTSTRAP_BASELINE_DIVERGED');return baselineDigest(actual);}
