# Code Style & Conventions

## JavaScript
- ES modules (`import`/`export`, `"type": "module"` in package.json)
- No TypeScript — plain `.js` files
- JSDoc comments for function documentation (with `@param` and `@returns`)
- `const` preferred over `let`; no `var`
- Descriptive UPPER_SNAKE_CASE for constants
- camelCase for functions and variables
- 2-space indentation
- No configured linter or formatter (no eslint/prettier config found)
- No test framework configured

## Bash Scripts
- `#!/usr/bin/env bash` shebang
- `set -euo pipefail` for strict error handling
- Functions use lowercase_snake_case
- Color constants for terminal output

## Workflow Prompts
- Numbered markdown files: `NNN-step-name.md` (e.g., `001-parse-input.md`)
- Optional YAML frontmatter with `model:` field (opus/sonnet/haiku)
- Steps are executed sequentially by the runner
