/**
 * G5-07 — Cockpit Automation Centre plugin registry (widgets without core modification).
 */

export type AutomationCentreWidgetPlugin = {
  pluginId: string;
  title: string;
  buildSummary: (input: { workspaceId: string }) => { summary: string; detail?: string };
};

export class AutomationCentrePluginRegistry {
  private readonly widgets = new Map<string, AutomationCentreWidgetPlugin>();

  registerWidget(plugin: AutomationCentreWidgetPlugin): void {
    this.widgets.set(plugin.pluginId, plugin);
  }

  listWidgetSummaries(workspaceId: string): Array<{ pluginId: string; title: string; summary: string }> {
    return [...this.widgets.values()].map((plugin) => {
      const built = plugin.buildSummary({ workspaceId });
      return {
        pluginId: plugin.pluginId,
        title: plugin.title,
        summary: built.summary,
      };
    });
  }

  resetForTests(): void {
    this.widgets.clear();
  }

  removePlugin(pluginId: string): void {
    this.widgets.delete(pluginId);
  }
}

export const automationCentrePluginRegistry = new AutomationCentrePluginRegistry();

export function resetAutomationCentrePluginRegistryForTests(): void {
  automationCentrePluginRegistry.resetForTests();
}
