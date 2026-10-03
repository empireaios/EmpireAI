import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

/** Versioned examiner evidence is historical scope, never a current usability verdict. */
export function readReasoningCertification(root = process.cwd()) {
  const read = (name: string) => {
    const file = path.join(root,'docs','mission-state',name);
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.size > 128000 || fs.realpathSync(file) !== file) throw Error('Evidence unavailable');
    const raw = fs.readFileSync(file,'utf8');
    return {value:JSON.parse(raw),sha256:createHash('sha256').update(raw).digest('hex')};
  };
  try {
    const {value:c,sha256} = read('CERTIFICATION_CLOSURE_2026-10-02.json');
    const required = Number(c.requiredDomainCount);
    const satisfied = Array.isArray(c.domainCoverage) ? c.domainCoverage.filter((d: {status?:string})=>d.status==='SATISFIED').length : 0;
    const ids = new Set(c.domainCoverage?.map((d: {id?:string})=>d.id));
    const valid = c.schema==='existing-unseen-coverage-reconciliation-v1' && required===17 &&
      c.satisfiedDomainCount===required && satisfied===required && ids.size===required &&
      c.scopeStatus==='BOUNDED_EXECUTIVE_REASONING_REQUIREMENTS_SATISFIED';
    const acceptance = read('PILLOW_OWNER_ACCEPTANCE.json').value;
    return {historical:{status:valid?'SATISFIED':'INCOMPLETE',observedAt:c.at,required,satisfied,
      representativeBattery:c.representativeBattery,scope:c.scopeStatus,exclusions:c.exclusions,
      evidencePath:'docs/mission-state/CERTIFICATION_CLOSURE_2026-10-02.json',sha256},
      currentOperability:{status:acceptance.status==='FAILED_OWNER_ACCEPTANCE'?'FAILED_OWNER_ACCEPTANCE':'UNKNOWN',
        reportedAt:acceptance.reportedAt,requiredGate:'KING PILLOW OWNER ACCEPTANCE TEST'}};
  } catch { return {historical:{status:'UNKNOWN'},currentOperability:{status:'UNKNOWN',requiredGate:'KING PILLOW OWNER ACCEPTANCE TEST'}}; }
}
