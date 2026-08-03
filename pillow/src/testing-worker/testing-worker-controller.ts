import type { TestingWorkerEngine } from "./engine.js";
export class TestingWorkerController { constructor(readonly engine:TestingWorkerEngine){} getCockpitSnapshot(){return this.engine.getCockpitSnapshot()} }
