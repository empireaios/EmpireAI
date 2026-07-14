/** T1-05 — Navigation relationship mapping. */

import type { LayoutModel } from "../layout-understanding-engine/types.js";
import type { NavigationEntry } from "./navigation-entry-rules.js";
import type { NavigationNode, NavigationRelationship } from "./types.js";

export class NavigationRelationshipMapper {
  map(
    layout: LayoutModel,
    nodes: NavigationNode[],
    entries: NavigationEntry[],
  ): NavigationRelationship[] {
    const relationships: NavigationRelationship[] = [];
    const screenNode = nodes.find((n) => n.kind === "screen" || n.kind === "page");

    for (const entry of entries) {
      const entryNode = nodes.find((n) => n.identifier === entry.entryId);
      if (!entryNode || !screenNode) continue;

      if (entry.nodeKind === "modal" || entry.nodeKind === "drawer") {
        relationships.push({
          relationshipId: `rel-${entryNode.nodeId}-${screenNode.nodeId}`,
          type: entry.nodeKind === "modal" ? "modal" : "drawer",
          fromNodeId: screenNode.nodeId,
          toNodeId: entryNode.nodeId,
          confidence: entry.confidence,
        });
      } else if (entry.nodeKind === "nav_item") {
        relationships.push({
          relationshipId: `rel-${screenNode.nodeId}-${entryNode.nodeId}`,
          type: "parent_child",
          fromNodeId: screenNode.nodeId,
          toNodeId: entryNode.nodeId,
          confidence: entry.confidence,
        });
      }
    }

    for (const { regionId, children } of layout.regionHierarchy) {
      const parentNode = nodes.find((n) => n.identifier.includes(regionId));
      if (!parentNode) continue;
      for (const childRegionId of children) {
        const childNode = nodes.find((n) => n.identifier.includes(childRegionId));
        if (!childNode) continue;
        relationships.push({
          relationshipId: `rel-hier-${parentNode.nodeId}-${childNode.nodeId}`,
          type: "parent_child",
          fromNodeId: parentNode.nodeId,
          toNodeId: childNode.nodeId,
          confidence: 0.7,
        });
      }
    }

    const sidebar = layout.regions.find((r) => r.regionType === "sidebar");
    const topNav = layout.regions.find((r) => r.regionType === "top_navigation");
    if (sidebar && screenNode) {
      const sidebarNode = nodes.find((n) => n.identifier.includes(sidebar.regionId));
      if (sidebarNode) {
        relationships.push({
          relationshipId: `rel-sidebar-${screenNode.nodeId}-${sidebarNode.nodeId}`,
          type: "parent_child",
          fromNodeId: screenNode.nodeId,
          toNodeId: sidebarNode.nodeId,
          confidence: 0.82,
        });
      }
    }
    if (topNav && screenNode) {
      const topNavNode = nodes.find((n) => n.identifier.includes(topNav.regionId));
      if (topNavNode) {
        relationships.push({
          relationshipId: `rel-topnav-${screenNode.nodeId}-${topNavNode.nodeId}`,
          type: "parent_child",
          fromNodeId: screenNode.nodeId,
          toNodeId: topNavNode.nodeId,
          confidence: 0.8,
        });
      }
    }

    return relationships;
  }
}
