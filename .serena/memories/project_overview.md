# ai-staff — Project Overview

## Purpose
A CLI-based workflow automation system that orchestrates multi-step AI workflows using Claude. Each workflow consists of numbered markdown prompt files that are executed sequentially by a bash runner script. The project also includes utility scripts (image generation, timestamps) exposed as Claude Code skills.

## Tech Stack
- **Runtime**: Node.js (ES modules, `"type": "module"`)
- **Language**: JavaScript (no TypeScript compilation — raw `.js` files)
- **AI APIs**: Google Gemini (`@google/genai`) for image generation; Anthropic Claude CLI for workflow execution
- **Workflow Runner**: Bash script (`run-workflow.sh`) that pipes prompts to `claude -p`
- **Environment**: Windows (MSYS/Git Bash)
- **Package Manager**: npm

## Key Dependencies
- `@google/genai` ^1.0.0 — Gemini API client for image generation

## Environment Variables (in `.env`)
- `GEMINI_API_KEY` — required for image generation
