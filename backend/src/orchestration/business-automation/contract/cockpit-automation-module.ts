/**
 * G5-07 — Cockpit Automation Centre Brain module contract.
 */

export const COCKPIT_AUTOMATION_MODULE_ID = "cockpit-automation" as const;

export type CockpitAutomationCapability =
  | "cockpit-automation.load"
  | "cockpit-automation.load_detail"
  | "cockpit-automation.load_timeline"
  | "cockpit-automation.execute_action";

export const COCKPIT_AUTOMATION_CAPABILITIES: CockpitAutomationCapability[] = [
  "cockpit-automation.load",
  "cockpit-automation.load_detail",
  "cockpit-automation.load_timeline",
  "cockpit-automation.execute_action",
];

export type CockpitAutomationModuleContract = {
  moduleId: typeof COCKPIT_AUTOMATION_MODULE_ID;
  capabilities: CockpitAutomationCapability[];
  missionId: "G5-07";
  integratesWith: [
    "business-automation",
    "pillow",
    "ekls",
    "brain",
    "registry",
    "executive-home",
    "cockpit-global-assistant",
  ];
};

export function createCockpitAutomationModuleContract(): CockpitAutomationModuleContract {
  return {
    moduleId: COCKPIT_AUTOMATION_MODULE_ID,
    capabilities: COCKPIT_AUTOMATION_CAPABILITIES,
    missionId: "G5-07",
    integratesWith: [
      "business-automation",
      "pillow",
      "ekls",
      "brain",
      "registry",
      "executive-home",
      "cockpit-global-assistant",
    ],
  };
}
