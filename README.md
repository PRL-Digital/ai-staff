# ai-staff

A CLI workflow automation system that orchestrates multi-step AI workflows using Claude. Each workflow is a series of numbered markdown prompt files executed sequentially by a bash runner script.

## Prerequisites

- **Node.js** (v18+)
- **npm**
- **Bash** (Git Bash / MSYS2 on Windows)
- **Claude CLI** — the `claude` command must be available on your PATH ([install guide](https://docs.anthropic.com/en/docs/claude-code))
- **agent-browser** — required for workflows that use browser automation

## Installation

```bash
# Clone the repository
git clone <repo-url> ai-staff
cd ai-staff

# Install Node.js dependencies
npm install

# Copy the example env file and add your keys
cp .env.example .env
# Edit .env and set GEMINI_API_KEY (required for image generation workflows)
```

### Install agent-browser (for browser automation workflows)

```bash
npm install -g agent-browser
```
```bash
agent-browser install
```

## Environment Variables

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your-gemini-api-key-here
```

## Running a Workflow

```bash
# Basic usage
bash run-workflow.sh <workflow-name> "<initial-argument>" [max-iterations]

# Resume a paused workflow
bash run-workflow.sh <workflow-name> --resume <slug> [max-iterations]

# List available workflows
bash run-workflow.sh --help
```

### Examples

```bash
# Run the wikipedia robot story workflow
bash run-workflow.sh wikipedia-robot-story "Find information about robots on Wikipedia and write a story opening"

# Run with a custom iteration limit
bash run-workflow.sh wikipedia-robot-story "Robots and their history" 10

# Resume a paused run
bash run-workflow.sh wikipedia-robot-story --resume robots-and-a3f2
```

## How Workflows Work

Each workflow lives in `workflows/<name>/` as a set of numbered markdown files:

```
workflows/my-workflow/
  001-first-step.md
  002-second-step.md
  003-review.md
```

### Step files

- Named `NNN-step-name.md` (e.g. `001-parse-input.md`)
- Optional YAML frontmatter with a `model:` field (`opus`, `sonnet`, or `haiku`)
- Steps execute sequentially; each step's output is saved to `output/<workflow>/<run-id>/`

### Control flow

Steps can control the workflow by editing the `IN-PROGRESS.md` file:

- **Continue normally**: leave `**next_step**` as `auto`
- **Redo a previous step**: set `**next_step**` to the step number (e.g. `002`)
- **Pause for human input**: set `**Status**` to `paused` and fill `**pause_reason**`

### Shared context

Steps share data through the `<run-dir>/context/` directory. Save any files (JSON, CSV, markdown) that later steps need here.

## Project Structure

```
ai-staff/
├── run-workflow.sh          # Main workflow runner
├── workflows/               # Workflow definitions
│   ├── wikipedia-robot-story/
│   │   ├── 001-research.md
│   │   ├── 002-create.md
│   │   ├── 003-review.md
│   │   ├── 004-complete.md
│   │   └── 005-generate-image.md
│   └── seo-keyword-content/
├── src/scripts/             # Utility scripts
│   ├── generate-image.js    # Gemini image generation
│   └── iso-now.sh           # UTC timestamp utility
├── output/                  # Generated workflow outputs
├── .claude/                 # Claude Code configuration & skills
├── package.json
└── .env                     # Environment variables (not committed)
```

## Utility Scripts

```bash
# Generate an image with Gemini
node --env-file=.env src/scripts/generate-image.js "<prompt>" [--ref <image-path>]...

# Get current UTC ISO 8601 timestamp
bash src/scripts/iso-now.sh
```
