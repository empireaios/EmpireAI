import { randomUUID } from 'node:crypto';
import type { ChildProcess } from 'node:child_process';

const protocol = 'work8-primary-capture-v1';
type Message = { protocol: string; id: string; action: string; generation?: string };
const message = (v: unknown): v is Message => !!v && typeof v === 'object' &&
  (v as Message).protocol === protocol && typeof (v as Message).id === 'string' &&
  /^[a-f0-9-]{36}$/.test((v as Message).id) && typeof (v as Message).action === 'string';

/** Private inherited IPC only. This fences the primary's registered admissions and
 * loops; it does not attest independent Redis producers or external observers. */
export function installPrimaryCaptureParticipant(child: ChildProcess,
  drain: (held: () => Promise<void>) => Promise<void>) {
  const generation = randomUUID();
  let active: string | undefined;
  let release: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const send = (id: string, action: string) => {
    if (child.connected) child.send({ protocol, id, action, generation }, () => {});
  };
  // On IPC loss, do not reopen primary writers until the requester is dead.
  const stop = () => { if (active && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); };
  const exited = () => { if (timer) clearTimeout(timer); release?.(); };
  const receive = (v: unknown) => {
    if (!message(v)) return;
    if (v.action === 'release' && active === v.id && v.generation === generation) {
      release?.(); return;
    }
    if (v.action !== 'acquire') return;
    if (active) { send(v.id, 'refused'); return; }
    active = v.id;
    timer = setTimeout(stop, 30_000);
    void drain(async () => {
      await new Promise<void>(resolve => {
        release = resolve;
        if (!child.connected || child.exitCode !== null || child.signalCode !== null) { stop(); resolve(); return; }
        send(v.id, 'held');
      });
    }).then(() => send(v.id, 'released'), () => send(v.id, 'refused')).finally(() => {
      if (timer) clearTimeout(timer);
      active = undefined; release = undefined;
    });
  };
  child.on('message', receive);
  child.on('disconnect', stop);
  child.on('exit', exited);
  return () => { child.off('message', receive); child.off('disconnect', stop); child.off('exit', exited); if (timer) clearTimeout(timer); };
}

export async function withPrimaryCaptureFence<T>(capture: () => Promise<T>): Promise<T> {
  if (process.env.EMPIRE_ROLE !== 'brain-worker' || !process.connected || !process.send)
    throw new Error('PRIMARY_CAPTURE_IPC_REQUIRED');
  const id = randomUUID();
  let generation: string | undefined;
  let stage: 'acquiring' | 'held' | 'releasing' = 'acquiring';
  let resolveHeld!: () => void, resolveReleased!: () => void, rejectLost!: (e: Error) => void;
  const held = new Promise<void>(r => { resolveHeld = r; });
  const released = new Promise<void>(r => { resolveReleased = r; });
  const lost = new Promise<never>((_, r) => { rejectLost = r; });
  let failure: Error | undefined;
  void lost.catch(() => {});
  const fail = () => { failure = new Error('PRIMARY_CAPTURE_FENCE_LOST'); rejectLost(failure); };
  const receive = (v: unknown) => {
    if (!message(v) || v.id !== id) return;
    if (v.action === 'held' && stage === 'acquiring' && typeof v.generation === 'string') {
      generation = v.generation; stage = 'held'; resolveHeld();
    } else if (v.action === 'released' && stage === 'releasing' && v.generation === generation) resolveReleased();
    else fail();
  };
  process.on('message', receive); process.on('disconnect', fail);
  const timer = setTimeout(fail, 29_000);
  const send = (action: string) => process.send!({ protocol, id, action, generation }, error => { if (error) fail(); });
  try {
    send('acquire'); await Promise.race([held, lost]);
    // Await callback completion even if IPC is lost. The caller must quarantine
    // any written manifest when this outer operation refuses success.
    const result = await capture();
    if (failure) throw failure;
    stage = 'releasing'; send('release');
    await Promise.race([released, lost]);
    return result;
  } catch (error) {
    // Refusal cleanup is part of the exclusion lifetime. Do not return to a
    // caller (which may immediately retry) until the owning primary generation
    // acknowledges release. A lost release is itself a fail-closed error.
    if (generation !== undefined && stage !== 'releasing' && process.connected && !failure) {
      stage = 'releasing'; send('release');
      await Promise.race([released, lost]);
    }
    throw error;
  } finally {
    clearTimeout(timer); process.off('message', receive); process.off('disconnect', fail);
    // A failed callback still releases a known fence; no success is returned.
    if (generation !== undefined && stage !== 'releasing' && process.connected) { stage = 'releasing'; send('release'); }
    void lost.catch(() => {});
  }
}
