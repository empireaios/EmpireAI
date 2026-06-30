import { findRepositoryRoot } from "./find-repo-root.js";

import { buildBootstrapFailure } from "./failure.js";

import {

  discoverEnhancements,

  discoverExecutiveAudits,

  discoverExtraDoctrines,

  discoverRealOwners,

  discoverRuntimeModules,

  parseAdrCount,

  parseCurrentMission,

  parseJourneyPosition,

  parseKnownActiveWork,

  parseKnownBacklog,

  resolveRepositoryVersion,

} from "./parsers.js";

import { reconstructRepository, validateRepositoryRoot } from "./reconstruction.js";

import { RepositoryReader } from "./repository-reader.js";

import type {

  BootstrapFailureResult,

  BootstrapResult,

  EmpireBootstrapContext,

  LoadedArtifact,

} from "./types.js";



export interface RunBootstrapOptions {

  repositoryRoot?: string;

}



/**

 * Repository Bootstrap Engine (PILLOW-002).

 * Performs repository reconstruction — discovers canonical sources by convention,

 * validates integrity, resolves dependencies, and verifies completeness before

 * entering Executive Ready state. Read-only.

 */

export async function runBootstrap(

  options: RunBootstrapOptions = {},

): Promise<BootstrapResult> {

  const started = performance.now();

  const completedAt = () => new Date().toISOString();



  let repositoryRoot = options.repositoryRoot ?? (await findRepositoryRoot());



  const readerForValidation = repositoryRoot

    ? new RepositoryReader(repositoryRoot)

    : null;

  const rootValid = await validateRepositoryRoot(readerForValidation);



  if (!repositoryRoot || !rootValid) {

    const durationMs = Math.round(performance.now() - started);

    return {

      bootstrapVersion: "PILLOW-002",

      status: "failure",

      completedAt: completedAt(),

      durationMs,

      repositoryRoot: options.repositoryRoot ?? process.cwd(),

      failure: buildBootstrapFailure(

        "REPOSITORY_ROOT_INVALID",

        "Could not locate EmpireAI repository root (JOURNEY.md + PILLOW_ARCHITECTURE_CONTRACT.md).",

        [],

      ),

      artifacts: [],

    } satisfies BootstrapFailureResult;

  }



  const reader = new RepositoryReader(repositoryRoot);

  const reconstruction = await reconstructRepository(reader);

  const artifacts = reconstruction.artifacts;



  if (reconstruction.integrityIssues.length > 0) {

    const durationMs = Math.round(performance.now() - started);

    return {

      bootstrapVersion: "PILLOW-002",

      status: "failure",

      completedAt: completedAt(),

      durationMs,

      repositoryRoot,

      failure: buildBootstrapFailure(

        "MANDATORY_ARTIFACT_MISSING",

        `Reconstruction integrity check failed: ${reconstruction.integrityIssues.length} issue(s).`,

        reconstruction.integrityIssues,

      ),

      artifacts,

      reconstruction: reconstruction.state,

    } satisfies BootstrapFailureResult;

  }



  if (reconstruction.selfAssessmentFailures.length > 0) {

    const durationMs = Math.round(performance.now() - started);

    return {

      bootstrapVersion: "PILLOW-002",

      status: "failure",

      completedAt: completedAt(),

      durationMs,

      repositoryRoot,

      failure: buildBootstrapFailure(

        "EXECUTIVE_SELF_ASSESSMENT_FAILED",

        `Executive Self-Assessment failed: ${reconstruction.selfAssessmentFailures.length} criterion gap(s).`,

        reconstruction.selfAssessmentFailures,

        reconstruction.selfAssessment,

      ),

      artifacts,

      reconstruction: reconstruction.state,

    } satisfies BootstrapFailureResult;

  }



  if (reconstruction.missingMandatory.length > 0) {

    const durationMs = Math.round(performance.now() - started);

    return {

      bootstrapVersion: "PILLOW-002",

      status: "failure",

      completedAt: completedAt(),

      durationMs,

      repositoryRoot,

      failure: buildBootstrapFailure(

        "MANDATORY_ARTIFACT_MISSING",

        `Repository reconstruction incomplete: ${reconstruction.missingMandatory.length} mandatory category gap(s).`,

        reconstruction.missingMandatory,

      ),

      artifacts,

      reconstruction: reconstruction.state,

    } satisfies BootstrapFailureResult;

  }



  const [

    journeyText,

    statusText,

    decisionsText,

    repositoryVersion,

    runtimeModules,

    executiveAudits,

    extraDoctrines,

  ] = await Promise.all([

    reader.readText("JOURNEY.md"),

    reader.readText("EMPIREAI_STATUS.md"),

    reader.readText("EMPIREAI_DECISIONS.md"),

    resolveRepositoryVersion(repositoryRoot),

    discoverRuntimeModules(reader),

    discoverExecutiveAudits(reader),

    discoverExtraDoctrines(reader),

  ]);



  const enhancements = await discoverEnhancements(reader, journeyText);

  const realOwners = discoverRealOwners(journeyText, runtimeModules);



  const mandatory = artifacts.filter(

    (a) => a.descriptor.requirement === "mandatory",

  );

  const optional = artifacts.filter(

    (a) => a.descriptor.requirement === "optional",

  );



  const durationMs = Math.round(performance.now() - started);



  const context: EmpireBootstrapContext = {

    bootstrapVersion: "PILLOW-002",

    status: "ready",

    executiveReady: true,

    reconstruction: reconstruction.state,

    completedAt: completedAt(),

    durationMs,

    repositoryRoot,

    repositoryVersion,

    journeyPosition: parseJourneyPosition(journeyText),

    currentMission: parseCurrentMission(journeyText, statusText),

    repositoryHealth: {

      mandatoryPresent: mandatory.filter((a) => a.present).length,

      mandatoryTotal: mandatory.length,

      optionalPresent: optional.filter((a) => a.present).length,

      optionalTotal: optional.length,

      healthy: true,

    },

    knownOwners: artifacts.filter(

      (a) =>

        a.descriptor.category === "repository_governance" ||

        a.descriptor.category === "backlog_release",

    ),

    knownContracts: artifacts.filter(

      (a) =>

        a.descriptor.category === "implementation_contract" ||

        a.descriptor.category === "component_contract",

    ),

    knownDoctrines: artifacts.filter((a) => a.descriptor.category === "doctrine"),

    knownDecisions: {

      registerPath: "EMPIREAI_DECISIONS.md",

      adrCount: parseAdrCount(decisionsText),

    },

    knownExecutiveAudits: executiveAudits,

    knownEnhancements: enhancements,

    knownArchitecture: {

      pillowContractPath: "PILLOW_ARCHITECTURE_CONTRACT.md",

      pillowDoctrinePaths: [

        "EMPIREAI_PILLOW_ARCHITECTURE.md",

        "EMPIREAI_PILLOW_MEMORY_DOCTRINE.md",

        ...extraDoctrines.filter(

          (p) =>

            p.includes("PILLOW") ||

            p.includes("ARCHITECTURE") ||

            p.includes("RECOVERY"),

        ),

      ],

    },

    knownBacklog: parseKnownBacklog(journeyText, reader),

    knownActiveWork: parseKnownActiveWork(journeyText, statusText),

    realOwners,

    artifacts,

    executiveSelfAssessment: reconstruction.selfAssessment!,

    executiveBriefing: reconstruction.executiveBriefing!,

  };



  return context;

}


