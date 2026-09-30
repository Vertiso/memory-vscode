# Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

# Vertiso Memory plugin changelog

## 1.3.1 — 2026-09-30

- Use 'skip the CSV report' in the wrap-up example across all plugin packages.

## 1.3.0 — 2026-08-28

- Add include: ["constraints"] to recall — task-scoped rule rows in the same
  call as context.
- Add synthesis: false to recall — retrieval facts only, answer omitted,
  confidence "none".
- Declare the constraints section and its row shape in recall's output schema.
- Teach the one-shot in the hello primer's constraints pointer.
- vmem recall gains --constraints and --no-synthesis.

## 1.2.0 — 2026-08-28

- Lead the hello primer with user_agent_instructions and pinned standing rules.
- Replace the primer's static contract with the vertiso-memory://contract
  resource.
- Ship count-honest intent and action indexes with overdue and undated tallies.
- Inherit user-asserted root tags onto fragments as deterministic taggings, so
  each rule carries its tags.
- Reuse a just-started agent session instead of minting one per hello,
  collapsing double-fired SessionStart hooks.
- Stamp primer_version: 2 so clients can detect the new shape.

## 1.1.1 — 2026-08-21

- Audit touched actions, intents, and projects for witnessed completion at
  wrap-up.
- Complete finished actions with complete_action; archive finished intents and
  projects with explicit completion.
- Keep a project active while any in-scope work remains open, closing only its
  finished children.
- Report actions completed and projects archived alongside intents archived.
- Refresh checkpoint skill references to the full closure set.

## 1.1.0 — 2026-08-05

- Teach the wrap-up skill to record durable follow-ons as actions instead of new
  intents.
- Reserve new-intent proposals for measurable outcomes to achieve or maintain.
- Refresh checkpoint skill references to the intents-and-actions work model.

## 1.0.0 — 2026-07-15

- Publish the initial Vertiso Memory extension for VS Code.
- Register the remote OAuth MCP server through VS Code's native MCP provider.
- Bundle four optional Agent Skills for durable memory workflows.
- Offer an optional CLI-managed SessionStart primer.
