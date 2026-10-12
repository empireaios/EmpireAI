import assert from 'node:assert/strict';

// The settlement event clock may advance only after all canonical work drains.
// This function never changes the independent elapsed-examination clock.
export async function settleAfterCompletion({command,event,now,pause}) {
  const started = now();
  for (;;) {
    const view = await command({kind:'inspect'});
    assert.ok(view.tasks.every(task => task.status !== 'BLOCKED'), 'Candidate blocked before settlement');
    if (view.tasks.length === 9 && view.tasks.every(task => task.status === 'COMPLETE')) break;
    assert.ok(now()-started < 60000, 'Ninth task did not drain');
    await pause(1000);
  }
  event({kind:'FINAL_TASK_DRAIN_BEFORE_SETTLEMENT',drainElapsedMs:now()-started});
  await command({kind:'settle'});
}

