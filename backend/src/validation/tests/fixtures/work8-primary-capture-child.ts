import { withPrimaryCaptureFence } from '../../../runtime/work8-primary-capture.js';
process.env.EMPIRE_ROLE = 'brain-worker';
process.on('message', async (v: any) => {
  if (v?.command !== 'run') return;
  try {
    const result = await withPrimaryCaptureFence(async () => {
      process.send!({ event: 'callback' });
      if (v.fail) throw Error('CALLBACK_FAILED');
      if (v.disconnect) { process.disconnect(); await new Promise(r => setTimeout(r, 100)); }
      return 'captured';
    });
    process.send?.({ event: 'result', result });
  } catch (error) { if (process.connected) process.send!({ event: 'error', error: String(error) }); }
});
process.send!({ event: 'ready' });
