import { FRAMEWORK_CAPABILITIES } from "./paths.js";
export class EmpireIntelligenceAbstractionLayer {
  describeInterfaces() {
    return { version: "PILLOW-EIF-001", structuralSignalsOnly: true,
      interfaces: [...FRAMEWORK_CAPABILITIES] };
  }
}
