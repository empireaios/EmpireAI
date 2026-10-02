import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PILLOW_CONTINUOUS_OBSERVER_CONFIGURATION,
  PILLOW_OBSERVER_AUTO_START_ENV,
  pillowContinuousObserverOptions,
  pillowObserverAutoStart,
  pillowRecurringObserversEnabled,
  type PillowRuntimeEnvironment,
} from "../../common/observer-runtime-policy.js";

describe("Pillow recurring observer runtime policy", () => {
  it("defaults every optional recurring observer off in the headless Brain worker", () => {
    const environment: PillowRuntimeEnvironment = {
      EMPIRE_ROLE: "brain-worker",
      VISUAL_CAPTURE_AUTO_START: "true",
    };

    assert.equal(pillowRecurringObserversEnabled(environment), false);
    const autoStartEntries = Object.entries(PILLOW_OBSERVER_AUTO_START_ENV);
    assert.equal(autoStartEntries.length, 9);
    for (const [engine, key] of autoStartEntries) {
      assert.equal(pillowObserverAutoStart(key, environment), false, engine);
    }
    const continuousEntries = Object.entries(PILLOW_CONTINUOUS_OBSERVER_CONFIGURATION);
    assert.equal(continuousEntries.length, 9);
    for (const [engine, key] of continuousEntries) {
      assert.deepEqual(pillowContinuousObserverOptions(key, environment), {
        configuration: { [key]: false },
      }, engine);
    }
  });

  it("requires the explicit headless opt-in and still honors legacy per-engine flags", () => {
    const optedIn: PillowRuntimeEnvironment = {
      EMPIRE_ROLE: "brain-worker",
      PILLOW_HEADLESS_OBSERVERS_ENABLED: "true",
      VISUAL_CAPTURE_AUTO_START: "false",
    };

    assert.equal(pillowRecurringObserversEnabled(optedIn), true);
    assert.equal(pillowObserverAutoStart("VISUAL_CAPTURE_AUTO_START", optedIn), false);
    assert.equal(pillowObserverAutoStart("UI_STATE_MAPPER_AUTO_START", optedIn), true);
    assert.equal(
      pillowContinuousObserverOptions(
        PILLOW_CONTINUOUS_OBSERVER_CONFIGURATION.continuousScreenObservation,
        optedIn,
      ),
      undefined,
    );
  });

  it("preserves legacy defaults outside the Brain worker", () => {
    const normalRuntime: PillowRuntimeEnvironment = {
      EMPIRE_ROLE: "api",
      PILLOW_HEADLESS_OBSERVERS_ENABLED: "false",
    };

    assert.equal(pillowRecurringObserversEnabled(normalRuntime), true);
    assert.equal(pillowObserverAutoStart("VISUAL_CAPTURE_AUTO_START", normalRuntime), true);
    assert.equal(
      pillowContinuousObserverOptions("continuousObservationEnabled", normalRuntime),
      undefined,
    );
    assert.equal(
      pillowObserverAutoStart(PILLOW_OBSERVER_AUTO_START_ENV.visualCapture, {
        ...normalRuntime,
        VISUAL_CAPTURE_AUTO_START: "false",
      }),
      false,
    );
  });

  it("fails closed for invalid or explicit false headless opt-in values", () => {
    for (const value of [undefined, "false", "garbage"]) {
      assert.equal(
        pillowRecurringObserversEnabled({
          EMPIRE_ROLE: "brain-worker",
          PILLOW_HEADLESS_OBSERVERS_ENABLED: value,
        }),
        false,
      );
    }
  });
});
