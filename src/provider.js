// Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

const MCP_PROVIDER_ID = "vertiso.memory";
const MCP_SERVER_LABEL = "Vertiso Memory";
const MCP_SERVER_URL = "https://memory.vertiso.ai/mcp";

/**
 * Create the Vertiso Memory MCP server provider.
 *
 * VS Code owns OAuth discovery, authorization, and token storage. This
 * provider deliberately supplies no headers and performs no network work
 * while the editor enumerates available servers.
 *
 * @param {typeof import("vscode")} vscode VS Code extension API.
 * @param {string} version Installed extension version.
 * @returns {import("vscode").McpServerDefinitionProvider}
 */
function createProvider(vscode, version) {
  return {
    provideMcpServerDefinitions() {
      return [
        new vscode.McpHttpServerDefinition(
          MCP_SERVER_LABEL,
          vscode.Uri.parse(MCP_SERVER_URL),
          undefined,
          version,
        ),
      ];
    },
  };
}

/**
 * Register the provider and retain its disposable for extension shutdown.
 *
 * @param {typeof import("vscode")} vscode VS Code extension API.
 * @param {import("vscode").ExtensionContext} context Extension context.
 * @returns {void}
 */
function registerProvider(vscode, context) {
  const provider = createProvider(vscode, context.extension.packageJSON.version);
  const disposable = vscode.lm.registerMcpServerDefinitionProvider(
    MCP_PROVIDER_ID,
    provider,
  );

  context.subscriptions.push(disposable);
}

module.exports = {
  MCP_PROVIDER_ID,
  MCP_SERVER_LABEL,
  MCP_SERVER_URL,
  createProvider,
  registerProvider,
};
