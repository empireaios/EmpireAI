// One host-created absolute stage budget. Child clocks cannot extend the stage.
import fs from 'node:fs';
import assert from 'node:assert/strict';

export function nativeDeadline(role,budget=JSON.parse(fs.readFileSync('/control/native-time-budget.json','utf8')),now=Date.now()) {
 const cause='CAMPAIGN_EXAMINATION_BOUND'; // Existing source-bound diagnostic code.
 assert.ok(['browser','coordinator'].includes(role),cause);
 assert.equal(budget.schema,'work8-v95-native-time-budget-v1',cause);
 assert.ok(['preflight','full'].includes(budget.stage),cause);
 assert.ok(Number.isSafeInteger(budget.stageSeconds)&&budget.stageSeconds>0&&budget.stageSeconds<=(budget.stage==='preflight'?900:1500),cause);
 assert.ok(Number.isSafeInteger(budget.startedAtEpochMs)&&Number.isSafeInteger(budget.stageDeadlineEpochMs),cause);
 assert.equal(budget.stageDeadlineEpochMs,budget.startedAtEpochMs+budget.stageSeconds*1000,cause);
 assert.equal(budget.browserReserveSeconds,390,cause);assert.equal(budget.coordinatorReserveSeconds,60,cause);assert.equal(budget.externalKillGraceSeconds,30,cause);
 if(role==='browser')assert.equal(budget.stage,'full',cause);
 const deadline=budget.stageDeadlineEpochMs-budget[role+'ReserveSeconds']*1000;
 assert.ok(Number.isSafeInteger(now)&&now>=budget.startedAtEpochMs&&now<deadline,cause);
 return deadline;
}
