# Vertiso Memory for VS Code

Vertiso Memory gives GitHub Copilot and other MCP-capable agents in VS Code a
portable, user-owned memory that follows you between tools.

The extension registers Vertiso Memory's remote MCP server and four Agent
Skills with VS Code. VS Code performs the OAuth sign-in and stores the
resulting authorization. The extension does not read or retain your Vertiso
credentials.

## Connect

1. Install the extension.
2. Open Chat in VS Code and view the available MCP servers.
3. Start **Vertiso Memory** and complete the browser sign-in when VS Code asks.
4. Ask the agent to remember or recall something.

Existing manual Vertiso Memory entries in `mcp.json` should be removed to avoid
showing the same server twice.

## What it provides

- Cross-agent memory recall and search.
- Explicit memory creation with safety controls.
- Agent Skills for checkpoints, handoffs, handoff resume, and wrap-up.
- OAuth authentication managed by VS Code.

## Optional SessionStart primer

The extension does not silently write files under `~/.copilot` or install a
SessionStart hook. The MCP server instructions provide the normal session
primer.

To opt into CLI-managed VS Code setup, including user-directory skill copies
and a `vmem hello` SessionStart hook, run:

```sh
vmem mcp install vscode
```

Use either the extension's remote OAuth MCP setup or the CLI-managed setup.
Using both can show Vertiso Memory twice in the MCP server list.

Vertiso Memory only stores information when you or your agent explicitly calls
its tools. It refuses secrets and other inappropriate memory content. See the
[privacy policy](https://memory.vertiso.ai/privacy) and
[documentation](https://memory.vertiso.ai/docs/install) for details.

## Support

Visit [Vertiso Memory support](https://memory.vertiso.ai/support) to report a
problem or ask a question. Source and issue tracking live in the public
[`Vertiso/memory-vscode`](https://github.com/Vertiso/memory-vscode)
repository.

This repository is a generated public mirror of Vertiso Memory's canonical
distribution source. Open issues here, but do not submit pull requests or
emergency source changes directly: the next mirror run replaces the repository
tree. Contact support when a source change is required.
