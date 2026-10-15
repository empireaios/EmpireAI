'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{createClock}=require('../f27-outer-controller.cjs');
test('one monotonic clock survives preflight and fault-window markers without reset',()=>{let now=100;const clock=createClock(()=>now);assert.equal(clock.origin,100);now=110;const preflight=clock.elapsed();now=200;const faultWindow=clock.elapsed();now=240;const observed=clock.elapsed();assert.equal(preflight,10);assert.equal(faultWindow,100);assert.equal(observed,140);assert.equal(observed-faultWindow,40);assert.equal(clock.origin,100);});
