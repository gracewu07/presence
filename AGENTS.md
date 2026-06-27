# AGENTS.md

## Project Overview

This repository is a React + Vite web application built with JavaScript and JSX.

The app uses:

* React
* Vite
* JavaScript / JSX
* Firebase
* React Router
* ESLint

The coding agent should help maintain, improve, debug, and document the project while preserving the existing structure and user experience unless explicitly asked to change it.

Before making changes, inspect the relevant files and explain the plan.

## Project Structure

Important folders and files include:

* `src/App.jsx` — main app routing and structure
* `src/main.jsx` — React entry point
* `src/index.css` — global styles
* `src/components/` — reusable UI components
* `src/pages/` — main app pages
* `src/context/` — React context providers
* `src/services/` — app services such as authentication and member logic
* `src/utils/` — helper functions
* `src/config/` — app configuration
* `src/lib/` — library setup, including Firebase
* `package.json` — scripts and dependencies

Prefer following the existing folder structure instead of creating new patterns.

## How the Agent Should Work

Before editing:

1. Inspect the relevant files.
2. Explain the plan in a few clear steps.
3. Ask before making major architectural changes.

While editing:

1. Make small, focused changes.
2. Avoid unrelated cleanup.
3. Preserve existing functionality unless the task specifically asks to change it.
4. Reuse existing components, utilities, styles, and patterns.
5. Do not rewrite large sections of the app unless explicitly requested.

After editing:

1. Summarize exactly what changed.
2. List the files changed.
3. Explain any assumptions made.
4. Run the appropriate checks when possible.

## Development Commands

Use the commands defined in `package.json`.

Common commands:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Use these guidelines:

* Use `npm run dev` for local development.
* Use `npm run build` after meaningful code changes.
* Use `npm run lint` after code cleanup or larger edits.
* Use `npm run preview` only when checking the production build locally.

If a command fails, explain the error and either fix it or clearly state what still needs attention.

## Package Installation

Do not install new packages without asking first.

If a new package seems useful:

1. Explain why it is needed.
2. Check whether the project already has a dependency that can solve the problem.
3. Ask for permission before running `npm install`.
4. After installing, update code carefully and run the relevant checks.

Avoid unnecessary dependencies.

## Code Style

* Follow the existing project style.
* Use JavaScript and JSX, not TypeScript, unless explicitly requested.
* Prefer clear, readable code.
* Keep component names and file names consistent with the existing app.
* Keep logic simple and easy to follow.
* Add comments only for non-obvious logic.
* Avoid clever or overly complex solutions.

## React Guidelines

* Prefer functional components.
* Use hooks consistently.
* Keep components focused on one purpose.
* Move repeated logic into utilities or services when appropriate.
* Reuse existing components from `src/components/` before creating new ones.
* Keep page-level logic in `src/pages/`.
* Keep reusable helper logic in `src/utils/` or `src/services/`.

## Firebase Guidelines

* Do not hardcode Firebase credentials.
* Do not hardcode API keys, passwords, tokens, or secrets.
* Use environment variables for Firebase configuration.
* Do not edit `.env` files unless explicitly asked.
* Do not commit real credentials.
* Be careful when changing authentication, Firestore reads/writes, or access-control logic.
* Explain security implications when working on auth, roles, or user data.

## Files to Be Careful With

Ask before making major changes to:

* `.env` or environment variable files
* `src/firebase.js`
* `src/lib/firebase.js`
* `src/context/AuthContext.jsx`
* `src/services/authService.js`
* `src/services/memberService.js`
* Firebase rules or deployment-related files
* `package.json`
* `package-lock.json`
* `vite.config.js`
* `eslint.config.js`

Do not edit secrets or credentials.

## UI and Design

* Generally preserve the current design unless explicitly asked to change it.
* Keep the app responsive on both mobile and desktop.
* Reuse existing CSS classes and component patterns.
* Do not make broad visual changes for a small functional task.
* If editing `src/index.css`, avoid changing the visual style unless the task is specifically about styling.
* Before deleting CSS, search JSX files to confirm whether the class is used.
* Be careful with dynamically generated class names.

## Testing and Verification

After changes, run the most relevant checks.

For most code changes:

```bash
npm run build
```

For cleanup or larger code edits:

```bash
npm run lint
npm run build
```

For local visual testing:

```bash
npm run dev
```

If the project has no automated tests, rely on build, lint, and manual browser checks.

## Git and Commits

Do not commit or push without asking first.

If asked to commit:

1. Summarize the changes first.
2. Suggest a commit message.
3. Ask for confirmation before running Git commands.

If asked to push:

1. Confirm the branch.
2. Confirm the remote.
3. Ask before pushing.

Keep commits small and focused.

## Safety Rules

* Do not delete files unless clearly unnecessary or explicitly requested.
* Do not remove features unless the user asks.
* Do not expose secrets.
* Do not change authentication or access-control behavior casually.
* Do not deploy unless explicitly asked.
* Do not run destructive commands without confirmation.

## Response Expectations

When completing a task, provide:

1. A brief summary of the work done.
2. Files changed.
3. Commands run.
4. Any remaining issues.
5. Suggested next step, if relevant.
