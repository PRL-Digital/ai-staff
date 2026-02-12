# Project Structure

```
ai-staff/
├── .claude/               # Claude Code configuration
│   ├── commands/          # Custom slash commands / skills
│   │   ├── go.md
│   │   └── skills/
│   │       ├── generate-image.md
│   │       ├── iso-now.md
│   │       └── agent-browser.md
│   └── settings.local.json
├── .serena/               # Serena configuration
│   └── project.yml        # Language: typescript (used for JS too)
├── src/
│   └── scripts/
│       ├── generate-image.js   # Gemini image generation (exported fn + CLI)
│       └── iso-now.sh          # UTC ISO 8601 timestamp utility
├── workflows/                  # Workflow definitions (numbered .md prompts)
│   ├── seo-keyword-content/    # SEO keyword research & content workflow (7 steps)
│   │   ├── 001-parse-input.md through 007-review.md
│   │   └── templates/
│   └── test-echo/              # Test workflow (3 steps)
│       ├── 001-analyze.md
│       ├── 002-execute.md
│       └── 003-review.md
├── output/                # Generated workflow outputs (gitignored except .gitkeep)
├── run-workflow.sh        # Main workflow runner (bash)
├── package.json           # Node.js config (ESM)
├── AGENTS.md              # Agent instructions (browser automation, credentials)
└── .env                   # Environment variables (gitignored)
```
