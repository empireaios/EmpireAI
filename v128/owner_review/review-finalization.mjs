// A seal may close admission immediately, but must not freeze a committed native
// input before its exact readback is retained. One attempt, one bounded drain.
export function createReadbackFence(){
 let state='IDLE';const waiters=new Set();
 function settle(ok){for(const entry of waiters){clearTimeout(entry.timer);ok?entry.resolve():entry.reject(Error('NATIVE_INPUT_READBACK_FAILED'));}waiters.clear();}
 return {
  begin(){if(state!=='IDLE')throw Error('NATIVE_INPUT_ALREADY_STARTED');state='PENDING';},
  finish(ok){if(state!=='PENDING')return false;state=ok?'SAVED':'FAILED';settle(ok);return true;},
  wait(timeoutMs){
   if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>5000)return Promise.reject(Error('NATIVE_INPUT_DRAIN_BOUND'));
   if(state==='IDLE'||state==='SAVED')return Promise.resolve();
   if(state==='FAILED')return Promise.reject(Error('NATIVE_INPUT_READBACK_FAILED'));
   return new Promise((resolve,reject)=>{const entry={resolve,reject,timer:null};entry.timer=setTimeout(()=>{state='FAILED';settle(false);},timeoutMs);waiters.add(entry);});
  },
  get state(){return state;},
 };
}
