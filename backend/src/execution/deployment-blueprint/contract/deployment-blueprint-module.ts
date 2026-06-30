/**

 * Deployment Blueprint module — generates deployment plans from materialized projects.

 */



import {

  DeploymentBlueprintEngine,

  defaultDeploymentBlueprintEngine,

  type DeploymentBlueprintInput,

} from "../engines/deployment-blueprint-engine.js";

import type { DeploymentPlan } from "../models/deployment-plan.js";

import {

  deploymentBlueprintScoring,

  scoreDeploymentBlueprint,

  type DeploymentBlueprintProjectInput,

} from "../scoring/deployment-blueprint-scoring.js";

import type {

  DeploymentBlueprintRepository,

  DeploymentBlueprintRepositoryQuery,

} from "../repositories/deployment-blueprint-repository.js";

import { createInMemoryDeploymentBlueprintRepository } from "../repositories/in-memory-deployment-blueprint-repository.js";



export const DEPLOYMENT_BLUEPRINT_MODULE_ID = "deployment-blueprint" as const;

export type DeploymentBlueprintModuleId = typeof DEPLOYMENT_BLUEPRINT_MODULE_ID;



export const DEPLOYMENT_BLUEPRINT_MODULE_VERSION = "0.1.0" as const;



export type DeploymentBlueprintCapability =

  | "deployment-blueprint.generate"

  | "deployment-blueprint.score"

  | "deployment-blueprint.persist"

  | "deployment-blueprint.list";



export const DEPLOYMENT_BLUEPRINT_CAPABILITIES: readonly DeploymentBlueprintCapability[] = [

  "deployment-blueprint.generate",

  "deployment-blueprint.score",

  "deployment-blueprint.persist",

  "deployment-blueprint.list",

] as const;



export type DeploymentBlueprintModuleContract = {

  moduleId: DeploymentBlueprintModuleId;

  version: string;

  capabilities: readonly DeploymentBlueprintCapability[];

};



export const DEPLOYMENT_BLUEPRINT_MODULE_CONTRACT: DeploymentBlueprintModuleContract = {

  moduleId: DEPLOYMENT_BLUEPRINT_MODULE_ID,

  version: DEPLOYMENT_BLUEPRINT_MODULE_VERSION,

  capabilities: DEPLOYMENT_BLUEPRINT_CAPABILITIES,

};



/** Orchestrates deployment blueprint generation and persistence. */

export class DeploymentBlueprintModule {

  readonly contract = DEPLOYMENT_BLUEPRINT_MODULE_CONTRACT;

  private readonly engine: DeploymentBlueprintEngine;



  constructor(

    private readonly repository: DeploymentBlueprintRepository,

    engine?: DeploymentBlueprintEngine,

  ) {

    this.engine = engine ?? new DeploymentBlueprintEngine(repository);

  }



  scoreDeploymentBlueprint = scoreDeploymentBlueprint;

  scoring = deploymentBlueprintScoring;



  generateDeploymentPlan(input: DeploymentBlueprintInput) {

    return this.engine.generateDeploymentPlan(input);

  }



  async persistDeploymentPlan(

    workspaceId: string,

    input: DeploymentBlueprintInput,

  ): Promise<DeploymentPlan> {

    return this.engine.generateAndSave(workspaceId, input);

  }



  async getDeploymentPlan(

    workspaceId: string,

    deploymentPlanId: string,

  ): Promise<DeploymentPlan | null> {

    return this.repository.getById(workspaceId, deploymentPlanId);

  }



  async getDeploymentPlanByProject(

    workspaceId: string,

    projectId: string,

  ): Promise<DeploymentPlan | null> {

    return this.repository.getByProject(workspaceId, projectId);

  }



  async listDeploymentPlans(

    workspaceId: string,

    filters: Omit<DeploymentBlueprintRepositoryQuery, "workspaceId"> = {},

  ): Promise<DeploymentPlan[]> {

    return this.repository.list({ workspaceId, ...filters });

  }

}



/** Factory for a deployment blueprint module with optional custom dependencies. */

export function createDeploymentBlueprintModule(

  repository: DeploymentBlueprintRepository = createInMemoryDeploymentBlueprintRepository(),

  engine?: DeploymentBlueprintEngine,

): DeploymentBlueprintModule {

  return new DeploymentBlueprintModule(

    repository,

    engine ?? new DeploymentBlueprintEngine(repository),

  );

}



export const deploymentBlueprintModule = createDeploymentBlueprintModule();



export type { DeploymentBlueprintInput, DeploymentBlueprintProjectInput };



export { defaultDeploymentBlueprintEngine };


