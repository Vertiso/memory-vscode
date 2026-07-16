// Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

const vscode = /** @type {typeof import("vscode")} */ (require("vscode"));
const { registerProvider } = /** @type {typeof import("./provider")} */ (
  require("./provider")
);

/**
 * Register Vertiso Memory when VS Code activates the extension.
 *
 * @param {import("vscode").ExtensionContext} context Extension context.
 * @returns {void}
 */
function activate(context) {
  registerProvider(vscode, context);
}

module.exports = { activate };
