# Suggested Commands

## Running Workflows
```bash
# Run a workflow with an initial argument
bash run-workflow.sh <workflow-name> "<initial-argument>" [max-iterations]

# Resume a paused workflow
bash run-workflow.sh <workflow-name> --resume <slug> [max-iterations]

# List available workflows
bash run-workflow.sh --help
```

## Utility Scripts
```bash
# Generate an image with Gemini
node --env-file=.env src/scripts/generate-image.js "<prompt>" [--ref <image-path>]...

# Get current UTC ISO 8601 timestamp
bash src/scripts/iso-now.sh
```

## Package Management
```bash
npm install          # Install dependencies
```

## System Utilities (Windows/MSYS)
- `git` — version control (note: repo not yet initialized)
- `ls`, `cd`, `cat`, `grep`, `find` — standard MSYS/bash utilities
- `node`, `npm` — Node.js runtime and package manager
