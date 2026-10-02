/** Independent transport/lock observation. Does not claim operational readiness. */
export function createRuntimeCollector({ origin, expectedRevision, fetchImpl = fetch, clock = Date.now }) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || !/^[a-f0-9]{40}$/.test(expectedRevision)) throw Error('Invalid pinned runtime target');
  return async signal => {
    const read = async route => {
      const r = await fetchImpl(url.origin + route, { signal, redirect:'error', headers:{accept:'application/json'} });
      if (!r.ok) throw Error('Health source unavailable');
      // Bound health documents before parsing; never read credentials or history.
      const reader=r.body.getReader();let size=0;const chunks=[];
      for (;;) { const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>32768){await reader.cancel();throw Error('Health source exceeds bound');}chunks.push(next.value); }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    };
    const [live,ready]=await Promise.all([read('/health/live'),read('/health/ready')]);
    return { origin:'independent-adapter', source:url.origin+'/health/live,/health/ready', evidenceId:'runtime-'+clock(), observedAt:clock(),
      authoritative:[{id:'backend-revision',value:expectedRevision},{id:'transport-ready',value:true},{id:'birth',value:'NOT_BORN'},{id:'commerce',value:'LOCKED'},{id:'operational',value:false}],
      internal:[{id:'backend-revision',value:live.deploy?.gitCommitSha??null},{id:'transport-ready',value:ready.ready??null},{id:'birth',value:ready.birth??null},{id:'commerce',value:ready.commerce??null},{id:'operational',value:ready.operational??null}] };
  };
}
