/** Canonical mission → implementation path registry for Repository Intelligence. */
export interface MissionEntry {
  id: string;
  name: string;
  rootPath: string;
  layer: string;
}

export const MISSION_REGISTRY: MissionEntry[] = [
  { id: "PILLOW-002", name: "Repository Bootstrap", rootPath: "pillow/src/bootstrap", layer: "pillow" },
  { id: "PILLOW-003", name: "Repository Intelligence", rootPath: "pillow/src/intelligence", layer: "pillow" },
  { id: "PILLOW-004", name: "Context Builder", rootPath: "pillow/src/context", layer: "pillow" },
  { id: "PILLOW-016", name: "OpenAI Integration Layer", rootPath: "pillow/src/openai", layer: "pillow" },
  { id: "PILLOW-RI-002", name: "Repository Architecture Intelligence", rootPath: "pillow/src/repository-intelligence", layer: "pillow" },
  { id: "SCR-800", name: "Development Pillow Chat", rootPath: "empireai-web/components/cockpit/development", layer: "frontend" },
  { id: "G4-09", name: "Global AI Assistant", rootPath: "empireai-web/lib/cockpit/global-assistant", layer: "frontend" },
  { id: "G5-01", name: "Automation Registry", rootPath: "backend/src/orchestration/business-automation", layer: "automation" },
  { id: "G2-01", name: "Commerce Registry", rootPath: "backend/src/registry", layer: "business_engine" },
  { id: "REAL-086", name: "King Decision History", rootPath: "backend/src/grand-king", layer: "governance" },
];

export function findMissionByKeyword(keyword: string): MissionEntry | undefined {
  const q = keyword.toLowerCase();
  return MISSION_REGISTRY.find(
    (m) =>
      m.id.toLowerCase() === q ||
      m.id.toLowerCase().replace("-", "") === q.replace("-", "") ||
      m.name.toLowerCase().includes(q) ||
      m.rootPath.toLowerCase().includes(q),
  );
}

export function findMissionById(id: string): MissionEntry | undefined {
  const normalized = id.toUpperCase();
  return MISSION_REGISTRY.find((m) => m.id === normalized);
}
