# AGENTS.md

## Project Overview

This repository contains a web application. The coding agent should help maintain, improve, debug, and document the project while preserving the existing architecture and user experience unless explicitly instructed otherwise.

Before making changes, inspect the relevant files and understand the current structure.

## How to Work in This Repository

* Make small, focused changes.
* Do not rewrite large sections of the codebase unless requested.
* Preserve existing functionality unless the task specifically asks to change it.
* Prefer editing existing files over creating unnecessary new files.
* Reuse existing components, utilities, and styling patterns when possible.
* Explain major changes after completing a task.

## Setup and Local Development

Use the commands defined in `package.json`.

Common commands may include:

```bash
npm install
npm run dev
npm run build
```

Before assuming a command exists, check `package.json`.

## Testing and Verification

After making code changes:

1. Run the most relevant check available.
2. If this is a frontend project, run:

```bash
npm run build
```

3. If tests exist, run the appropriate test command from `package.json`.
4. If a command fails, explain the error and either fix it or clearly state what still needs attention.

## Code Style

* Follow the style already used in the project.
* Keep naming consistent with nearby files.
* Prefer clear, readable code over clever code.
* Add comments only when they clarify non-obvious logic.
* Avoid unnecessary dependencies.
* Do not introduce a new library if the project can reasonably solve the task with existing tools.

## File Organization

* Keep related code close together.
* Place reusable UI pieces in a components folder if the project has one.
* Place shared helper functions in a utilities, services, or lib folder if the project has one.
* Do not move files around unless the task is specifically about organization or cleanup.

## Security and Secrets

* Do not hardcode API keys, passwords, tokens, secrets, or private credentials.
* Do not edit `.env` files unless explicitly asked.
* Do not commit real credentials.
* Use environment variables for configuration.
* If a task involves authentication, access control, or user data, be extra careful and explain the security implications.

## UI and Design

* Preserve the current visual design unless explicitly asked to redesign.
* Keep the app responsive on both mobile and desktop.
* Reuse existing design patterns, components, and class names.
* Do not change styling broadly when the task only asks for a small fix.

## Git and Commits

* Do not commit or push changes unless explicitly asked.
* Keep changes reviewable.
* Summarize changed files and the reason for each change.

## Agent Behavior

Before editing:

* Briefly state the plan.
* Identify the files likely involved.

While editing:

* Keep the scope narrow.
* Avoid unrelated cleanup.

After editing:

* Summarize what changed.
* Mention any commands run.
* Mention any remaining issues or assumptions.
