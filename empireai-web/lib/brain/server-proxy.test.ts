import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveBrainApiUrl, LOCKED_BRAIN_URL} from './server-proxy';
test('production binding fails closed and never silently selects legacy', () => {
 const before = {...process.env};
 try {
  process.env.VERCEL='1'; process.env.VERCEL_ENV='production';
  for (const value of ['', 'https://empireai-production.up.railway.app', 'http://localhost:4000', LOCKED_BRAIN_URL+'/other', 'https://secret:password@example.com']) {
   process.env.BRAIN_API_URL=value;
   assert.throws(resolveBrainApiUrl);
  }
  process.env.BRAIN_API_URL=LOCKED_BRAIN_URL+'/'; assert.equal(resolveBrainApiUrl(),LOCKED_BRAIN_URL);
 } finally { for (const key of ['VERCEL','VERCEL_ENV','BRAIN_API_URL']) { if(before[key]===undefined) delete process.env[key]; else process.env[key]=before[key]; } }
});
