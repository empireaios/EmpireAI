import assert from "node:assert/strict";
import { test } from "node:test";
import { subscribeRead } from "./subscribe-read";

test("Strict Mode setup/cleanup/setup starts only the surviving read", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  let requests = 0;
  const read = () => { requests++; };
  const discard = subscribeRead(read, 5000);
  assert.equal(requests, 0, "no synchronous loading cascade");
  discard();
  const cleanup = subscribeRead(read, 5000);
  t.mock.timers.tick(0);
  assert.equal(requests, 1);
  t.mock.timers.tick(5000);
  assert.equal(requests, 2);
  cleanup();
  t.mock.timers.tick(15000);
  assert.equal(requests, 2, "unmounted subscriptions cannot start more requests");
});

test("one-shot read and manual refresh do not acquire a polling loop", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "setInterval"] });
  let requests = 0;
  const read = () => { requests++; };
  const cleanup = subscribeRead(read);
  t.mock.timers.tick(0);
  read();
  t.mock.timers.tick(60000);
  assert.equal(requests, 2);
  cleanup();
});
