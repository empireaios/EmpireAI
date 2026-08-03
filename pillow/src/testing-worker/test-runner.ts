import type { TestCase,TestRunner } from "./types.js";
type Outcome={outcome:"passed"|"failed"|"skipped";evidence?:string;coverageDelta?:{lines?:number;branches?:number;functions?:number;statements?:number}};
export class InMemoryTestRunner implements TestRunner { private outcomes=new Map<string,Outcome>(); configure(caseId:string,outcome:Outcome){this.outcomes.set(caseId,outcome);return this} run(testCase:TestCase){return this.outcomes.get(testCase.caseId)??{outcome:"failed",evidence:"No explicit test runner outcome configured"}} }
