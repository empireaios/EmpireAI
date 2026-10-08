import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const time = value => Date.parse(value);
function read(filename, sql, workspace) {
  const stat = fs.lstatSync(filename);
  if (!stat.isFile() || stat.nlink !== 1 || stat.size > 64*1024*1024 || fs.realpathSync(filename) !== filename) throw Error('Unsafe resolution source');
  const db = new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:1000});
  try {
    db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
    if (db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok') throw Error('Invalid resolution source');
    const rows = db.prepare(sql).all(workspace);
    if (rows.length >= 10000) throw Error('Resolution inventory exceeds bound');
    return rows.map(r => r.session === undefined ? JSON.parse(r.body) : {session:r.session,turns:JSON.parse(r.body)});
  } finally { if (db.isTransaction) db.exec('ROLLBACK'); db.close(); }
}

/** Re-read canonical mission and request sources; never trust the derived view.
 * A successor resolves an operational failure, not the original failed delivery.
 */
export function readDeliveryResolutions(directory, workspace, now) {
  const missions = read(path.join(directory,'intelligence.sqlite'), "SELECT body FROM objects WHERE workspace=? AND kind='investigations' LIMIT 10000",workspace);
  const requests = read(path.join(directory,'pillow-request-receipts.sqlite'), 'SELECT body FROM receipts WHERE workspace=? LIMIT 10000',workspace);
  const transcripts = read(path.join(directory,'pillow-reasoning.sqlite'), 'SELECT session,turns AS body FROM transcripts WHERE workspace=? LIMIT 10000',workspace);
  return failed => {
    const original = requests.find(r => r.requestId === failed.requestId);
    if (!original || original.workspaceId !== workspace || original.sessionId !== failed.sessionId || original.status !== failed.status || original.failureClass !== failed.failureClass) return null;
    const result = Object.hasOwn(failed,'resultJson') ? JSON.parse(failed.resultJson) : failed.finalResult;
    if (hash(original.finalResult??null) !== hash(result??null)) return null;
    const sessions=transcripts.filter(t=>t.session===original.sessionId);
    if(sessions.length>1||sessions.some(t=>!Array.isArray(t.turns)||t.turns.length>48))throw Error('Invalid failure transcript');
    const answers=(sessions[0]?.turns??[]).filter(t=>t.requestId===original.requestId&&t.role==='assistant');
    if(answers.length>1)throw Error('Ambiguous failure transcript');
    const responseText=answers[0]?.content??original.finalResult?.message??null;
    const proofHash = hash({status:original.status,failureClass:original.failureClass??null,finalResult:original.finalResult??null,responseText});
    const matches = missions.filter(m => m.status === 'COMPLETE' && m.predecessors?.includes(failed.requestId) && m.predecessorProof?.some(p => p.id === failed.requestId && p.hash === proofHash));
    const verified = matches.filter(m => {
      const successor = requests.find(r => r.requestId === m.requestId);
      const a = m.assessment, c = m.closure, answer = successor?.finalResult?.message;
      const closed = time(c?.at), assessed = time(a?.at), failedAt = time(original.updatedAt);
      return successor?.workspaceId === workspace && successor.status === 'COMPLETED' && successor.requestId !== failed.requestId &&
        typeof answer === 'string' && a?.requestId === successor.requestId && hash(answer) === a.sha256 &&
        hash(a.answer??a.text??a.content??'') === a.sha256 &&
        Number.isFinite(closed) && Number.isFinite(assessed) && Number.isFinite(failedAt) && closed <= now && closed >= assessed && assessed > failedAt &&
        c?.predecessorsPreserved === true && typeof c.owner === 'string' && c.owner.length > 0 &&
        c.advisorReadback?.attestedBy === 'AUTHENTICATED_OWNER' && c.advisorReadback.requestId === successor.requestId && c.advisorReadback.assessmentHash === a.sha256;
    });
    if (verified.length !== 1) return null;
    const m = verified[0];
    return {status:'RESOLVED_BY_VERIFIED_SUCCESSOR',originalRequestId:failed.requestId,originalStatus:failed.status,originalSha256:hash(original),successorRequestId:m.requestId,missionId:m.id,missionSha256:hash(m),closedAt:m.closure.at};
  };
}
