import type { LLMToolDefinition, RegisteredTool } from "../types.js";

export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();

  register(tool: RegisteredTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  registerMany(tools: RegisteredTool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  require(name: string): RegisteredTool {
    const tool = this.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool;
  }

  list(filter?: { module?: string }): RegisteredTool[] {
    const all = [...this.tools.values()];
    if (!filter?.module) return all;
    return all.filter((tool) => tool.module === filter.module);
  }

  toLLMDefinitions(names: string[]): LLMToolDefinition[] {
    return names.map((name) => {
      const tool = this.require(name);
      return {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      };
    });
  }
}
