#!/usr/bin/env python3
"""Arithmetic review only: no processes, business execution or virtual clock mutation."""
import json, math
admissions=list(range(0,2401,300))
assert len(admissions)==9
# Conservative bound: all nine plans consume a slot from the outset, including
# not-yet-admitted plans; no benefit claimed from idle slots or early completion.
# Each round takes 9*5s. Allow 75s admission+completion, and an additional 60s
# cumulative scheduling/restart/Redis/readback loss before payout advancement.
# Payout advances only after all nine actual tasks and finance plans exist.
settlement_latest=2475
prior_lower=[min(10,max(0,math.floor((settlement_latest-(a+75)-60)/45))) for a in admissions]
remaining=108-sum(prior_lower)
required=remaining*5+30 # unchanged cadence plus 30-second seal margin
available=2700-settlement_latest
assert remaining==33, (prior_lower,remaining)
assert required<=available
print(json.dumps({'status':'PASS_SCHEDULE_ARITHMETIC_ONLY','elapsedSeconds':2700,
 'admissionsSeconds':admissions,'schedulerSeconds':5,'events':108,
 'allEventsProcessingFloorSeconds':540,'conservativePreSettlementEvents':prior_lower,
 'settlementLatestSeconds':settlement_latest,'remainingEventsUpperBound':remaining,
 'postSettlementRequiredSeconds':required,'postSettlementAvailableSeconds':available,
 'marginSeconds':available-required,'assumptions':['75s admission and canonical completion allowance per task','60s cumulative pre-settlement interruption allowance','all plans exist before explicit virtual advance','five-second unchanged application scheduler'],
 'runtimeGate':'Actual remainingEvents*6000+30000 must fit actual remaining monotonic duration',
 'limitations':'Planning bounds are checked against observed evidence; this is not an examination PASS'}))
