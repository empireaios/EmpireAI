/**
 * G8-05 — Authorization Centre plugin registry.
 */

export type AuthorizationCentrePluginWidget = {
  pluginId: string;
  title: string;
  buildSummary: (input: { workspaceId: string; providerId?: string }) => { summary: string };
};

const widgets: AuthorizationCentrePluginWidget[] = [];

export const authorizationCentrePluginRegistry = {
  registerWidget(widget: AuthorizationCentrePluginWidget): void {
    if (widgets.some((entry) => entry.pluginId === widget.pluginId)) return;
    widgets.push(widget);
  },
  listWidgets(): AuthorizationCentrePluginWidget[] {
    return [...widgets];
  },
  resetForTests(): void {
    widgets.length = 0;
  },
};
