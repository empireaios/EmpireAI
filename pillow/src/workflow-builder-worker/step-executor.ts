import type { StepHandler,StepOutcome,WorkflowStep } from "./types.js";
/** Delegates task execution; it deliberately never manufactures a success outcome. */
export class StepExecutor {constructor(private handler:StepHandler){} execute(step:WorkflowStep,context:Record<string,unknown>):Promise<StepOutcome>{return Promise.resolve(this.handler.execute(step,context))}}
