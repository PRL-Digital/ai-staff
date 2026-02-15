#!/usr/bin/env bash
set -euo pipefail

# ── Colors & Formatting ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── Model Mapping ────────────────────────────────────────────────────
declare -A MODEL_MAP=(
  [opus]="claude-opus-4-6"
  [sonnet]="claude-sonnet-4-5-20250929"
  [haiku]="claude-haiku-4-5-20251001"
)
DEFAULT_MODEL="opus"

# ── Helper Functions ─────────────────────────────────────────────────
timestamp() { date '+%H:%M:%S'; }
iso_timestamp() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
human_timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log_step()  { echo -e "${DIM}[$(timestamp)]${RESET} ${BLUE}STEP${RESET}  $*"; }
log_ok()    { echo -e "${DIM}[$(timestamp)]${RESET} ${GREEN}OK${RESET}    $*"; }
log_warn()  { echo -e "${DIM}[$(timestamp)]${RESET} ${YELLOW}WARN${RESET}  $*"; }
log_error() { echo -e "${DIM}[$(timestamp)]${RESET} ${RED}ERROR${RESET} $*"; }

die() { log_error "$@"; exit 1; }

generate_slug() {
  local arg="$1"
  local words
  words=$(echo "$arg" | tr '[:upper:]' '[:lower:]' | tr -cs '[:alnum:]' ' ' \
    | awk '{for(i=1;i<=3&&i<=NF;i++) printf "%s-", $i}' | sed 's/-$//')
  local hex
  hex=$(printf '%04x' $((RANDOM % 65536)))
  echo "${words}-${hex}"
}

# ── Frontmatter Parsing ─────────────────────────────────────────────
# Extracts model from YAML frontmatter, returns default if not found
parse_frontmatter_model() {
  local file="$1"
  local in_frontmatter=false
  local model=""
  while IFS= read -r line; do
    if [[ "$line" == "---" ]]; then
      if $in_frontmatter; then
        break
      else
        in_frontmatter=true
        continue
      fi
    fi
    if $in_frontmatter && [[ "$line" =~ ^model:[[:space:]]*(.+)$ ]]; then
      model="${BASH_REMATCH[1]}"
      model=$(echo "$model" | xargs)
    fi
  done < "$file"
  echo "${model:-$DEFAULT_MODEL}"
}

# Strip frontmatter from prompt content
strip_frontmatter() {
  local file="$1"
  if head -1 "$file" | grep -q '^---$'; then
    awk 'BEGIN{skip=0} /^---$/{skip++; next} skip>=2||skip==0{print}' "$file"
  else
    cat "$file"
  fi
}

# ── Stream JSON Parsing ─────────────────────────────────────────────
# Reads claude's stream-json output, displays text, captures result
# Uses Node.js instead of jq for JSON parsing
json_extract() {
  echo "$1" | node "${AI_STAFF_DIR}/src/scripts/json-extract.js" "$2"
}

parse_stream_json() {
  local output_file="$1"
  local result_text=""

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue

    local msg_type
    msg_type=$(json_extract "$line" "o.type") || continue
    [[ -z "$msg_type" ]] && continue

    if [[ "$msg_type" == "assistant" ]]; then
      local text
      text=$(json_extract "$line" "(o.message.content||[]).filter(c=>c.type==='text').map(c=>c.text).join('\\n')") || true
      if [[ -n "$text" ]]; then
        echo -e "  ${DIM}${text}${RESET}"
        result_text="$text"
      fi
    elif [[ "$msg_type" == "result" ]]; then
      local res
      res=$(json_extract "$line" "o.result") || true
      if [[ -n "$res" ]]; then
        result_text="$res"
      fi
    fi
  done

  if [[ -n "$result_text" ]]; then
    echo "$result_text" > "$output_file"
  fi
}

# ── IN-PROGRESS.md Field Operations ─────────────────────────────────
read_field() {
  local file="$1" field="$2"
  sed -n "s/.*\*\*${field}\*\*:[[:space:]]*//p" "$file" 2>/dev/null | head -1 | sed 's/[[:space:]]*$//'
}

update_field() {
  local file="$1" field="$2" value="$3"
  sed -i "s|\(\*\*${field}\*\*:\)[[:space:]]*.*|\1 ${value}|" "$file"
}

append_history() {
  local file="$1" entry="$2"
  echo "- ${entry}" >> "$file"
}

# ── Graceful Shutdown ────────────────────────────────────────────────
INTERRUPTED=false
cleanup() {
  INTERRUPTED=true
  echo ""
  log_warn "Interrupted. Finishing current step..."
}
trap cleanup SIGINT SIGTERM

# ── Argument Parsing ─────────────────────────────────────────────────
AI_STAFF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RESUME_SLUG=""
WORKFLOW_NAME=""
INITIAL_ARG=""
MAX_ITERATIONS=50
PROJECT_DIR=""

# Parse --project flag (must come before positional args)
while [[ "${1:-}" == --* ]]; do
  case "${1:-}" in
    --project)
      shift
      PROJECT_DIR="$(cd "${1:?Error: --project requires a path}" && pwd)"
      shift
      ;;
    --help)
      break  # handled below
      ;;
    *)
      break  # unknown flag, let later parsing handle it
      ;;
  esac
done

# Default PROJECT_DIR to AI_STAFF_DIR when --project is not used
PROJECT_DIR="${PROJECT_DIR:-$AI_STAFF_DIR}"
WORKFLOW_DIR="${PROJECT_DIR}/workflows"
OUTPUT_DIR="${PROJECT_DIR}/output"

# Build the --project prefix for resume hints
if [[ "$PROJECT_DIR" != "$AI_STAFF_DIR" ]]; then
  PROJECT_FLAG="--project ${PROJECT_DIR} "
else
  PROJECT_FLAG=""
fi

if [[ "${1:-}" == "--help" ]] || [[ -z "${1:-}" ]]; then
  echo "Usage: $0 [--project <path>] <workflow-name> \"<initial-argument>\" [max-iterations]"
  echo "       $0 [--project <path>] <workflow-name> --resume <slug> [max-iterations]"
  echo ""
  echo "Options:"
  echo "  --project <path>   Use workflows and output from an external project directory"
  echo "  --resume <slug>    Resume a paused run"
  echo "  --help             Show this help"
  echo ""
  if [[ "$PROJECT_DIR" != "$AI_STAFF_DIR" ]]; then
    echo "Available workflows (from ${PROJECT_DIR}):"
  else
    echo "Available workflows:"
  fi
  for d in "${WORKFLOW_DIR}"/*/; do
    [[ -d "$d" ]] && echo "  - $(basename "$d")"
  done
  exit 0
fi

WORKFLOW_NAME="$1"
shift

if [[ "${1:-}" == "--resume" ]]; then
  shift
  RESUME_SLUG="${1:?Error: --resume requires a slug}"
  shift
  MAX_ITERATIONS="${1:-50}"
else
  INITIAL_ARG="${1:?Error: initial argument required}"
  shift
  MAX_ITERATIONS="${1:-50}"
fi

# ── Validate Prerequisites ────────────────────────────────────────────
if ! command -v claude &>/dev/null; then
  die "claude CLI not found on PATH. Install it or run from a shell where it's available."
fi
if ! command -v node &>/dev/null; then
  die "node not found on PATH. Install Node.js (v18+)."
fi
if ! command -v tsx &>/dev/null; then
  if [[ -x "${AI_STAFF_DIR}/node_modules/.bin/tsx" ]]; then
    export PATH="${AI_STAFF_DIR}/node_modules/.bin:$PATH"
  else
    die "tsx not found on PATH. Run: npm install --save-dev tsx"
  fi
fi

# ── Validate Workflow ────────────────────────────────────────────────
WF_PATH="${WORKFLOW_DIR}/${WORKFLOW_NAME}"
if [[ ! -d "$WF_PATH" ]]; then
  log_error "Workflow '${WORKFLOW_NAME}' not found at ${WF_PATH}/"
  echo ""
  echo "Available workflows:"
  for d in "${WORKFLOW_DIR}"/*/; do
    [[ -d "$d" ]] && echo "  - $(basename "$d")"
  done
  exit 1
fi

# Get sorted prompt files
mapfile -t PROMPT_FILES < <(find "$WF_PATH" -maxdepth 1 -name '*.md' -type f | sort)
if [[ ${#PROMPT_FILES[@]} -eq 0 ]]; then
  die "No .md prompt files found in ${WF_PATH}/"
fi

# Extract step numbers and names
declare -a STEP_NUMBERS=()
declare -a STEP_NAMES=()
for pf in "${PROMPT_FILES[@]}"; do
  fname=$(basename "$pf" .md)
  num=$(echo "$fname" | grep -oE '^[0-9]+')
  STEP_NUMBERS+=("$num")
  STEP_NAMES+=("$fname")
done
STEP_COUNT=${#PROMPT_FILES[@]}
STEP_LIST=$(printf '%s, ' "${STEP_NAMES[@]}" | sed 's/, $//')

# ── Setup Run Directory ──────────────────────────────────────────────
if [[ -n "$RESUME_SLUG" ]]; then
  SLUG="$RESUME_SLUG"
  RUN_DIR="${OUTPUT_DIR}/${WORKFLOW_NAME}/${SLUG}"
  PROGRESS_FILE="${RUN_DIR}/IN-PROGRESS.md"
  if [[ ! -f "$PROGRESS_FILE" ]]; then
    die "Cannot resume: ${PROGRESS_FILE} not found"
  fi
  INITIAL_ARG=$(read_field "$PROGRESS_FILE" "Initial Argument")
  update_field "$PROGRESS_FILE" "Status" "running"
  update_field "$PROGRESS_FILE" "Last Updated" "$(iso_timestamp)"
  log_ok "Resumed run ${SLUG}"
else
  SLUG=$(generate_slug "$INITIAL_ARG")
  RUN_DIR="${OUTPUT_DIR}/${WORKFLOW_NAME}/${SLUG}"
  mkdir -p "${RUN_DIR}/context"
  PROGRESS_FILE="${RUN_DIR}/IN-PROGRESS.md"

  cat > "$PROGRESS_FILE" << EOF
# Workflow Progress

- **Workflow**: ${WORKFLOW_NAME}
- **Run ID**: ${SLUG}
- **Status**: running
- **Current Step**: ${STEP_NAMES[0]}
- **Iteration**: 1
- **Started**: $(iso_timestamp)
- **Last Updated**: $(iso_timestamp)
- **Initial Argument**: ${INITIAL_ARG}

## Next Action
- **next_step**: auto
- **pause_reason**:

## Step History
EOF
fi

# ── Startup Banner ───────────────────────────────────────────────────
START_TIME=$(date +%s)
BANNER_TITLE="WORKFLOW: ${WORKFLOW_NAME}"
BANNER_WIDTH=70
PADDING=$(( (BANNER_WIDTH - ${#BANNER_TITLE}) / 2 ))

echo -e "${BOLD}"
echo "╔══════════════════════════════════════════════════════════════════════╗"
printf "║%*s%s%*s║\n" $PADDING "" "$BANNER_TITLE" $((BANNER_WIDTH - PADDING - ${#BANNER_TITLE})) ""
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo -e "  Run ID:    ${CYAN}${SLUG}${RESET}"
echo -e "  Steps:     ${STEP_COUNT} (${STEP_LIST})"
if [[ "$PROJECT_DIR" != "$AI_STAFF_DIR" ]]; then
  echo -e "  Project:   ${DIM}${PROJECT_DIR}/${RESET}"
fi
echo -e "  Output:    ${DIM}${RUN_DIR}/${RESET}"
echo -e "  Max iter:  ${MAX_ITERATIONS}"
echo -e "  Started:   $(human_timestamp)"
echo ""

# ── Main Loop ────────────────────────────────────────────────────────
ITERATION=$(read_field "$PROGRESS_FILE" "Iteration")
ITERATION=${ITERATION:-1}
REDO_FROM=""
SHOW_ITER_HEADER=true
ITER_START=$(date +%s)

while true; do
  $INTERRUPTED && break

  # Read current state
  STATUS=$(read_field "$PROGRESS_FILE" "Status")
  CURRENT_STEP=$(read_field "$PROGRESS_FILE" "Current Step")
  NEXT_STEP=$(read_field "$PROGRESS_FILE" "next_step")

  # Check status
  if [[ "$STATUS" == "paused" ]]; then
    PAUSE_REASON=$(read_field "$PROGRESS_FILE" "pause_reason")
    echo ""
    log_warn "Workflow paused: ${PAUSE_REASON:-no reason given}"
    echo -e "  Resume with: ${CYAN}$0 ${PROJECT_FLAG}${WORKFLOW_NAME} --resume ${SLUG}${RESET}"
    break
  fi

  if [[ "$STATUS" == "completed" ]]; then
    log_ok "Workflow already completed"
    break
  fi

  # Check iteration limit
  if [[ "$ITERATION" -gt "$MAX_ITERATIONS" ]]; then
    log_warn "Max iterations (${MAX_ITERATIONS}) reached"
    echo -e "  Resume with: ${CYAN}$0 ${PROJECT_FLAG}${WORKFLOW_NAME} --resume ${SLUG}${RESET}"
    break
  fi

  # Handle redo: next_step set to a specific step number
  if [[ "$NEXT_STEP" != "auto" ]] && [[ -n "$NEXT_STEP" ]]; then
    local_found=false
    for i in "${!STEP_NUMBERS[@]}"; do
      if [[ "${STEP_NUMBERS[$i]}" == "$NEXT_STEP" ]]; then
        CURRENT_STEP="${STEP_NAMES[$i]}"
        local_found=true
        break
      fi
    done
    if ! $local_found; then
      log_warn "Requested step ${NEXT_STEP} not found, continuing normally"
    else
      update_field "$PROGRESS_FILE" "next_step" "auto"
      update_field "$PROGRESS_FILE" "Current Step" "$CURRENT_STEP"
    fi
  fi

  # Find current step index
  STEP_IDX=-1
  for i in "${!STEP_NAMES[@]}"; do
    if [[ "${STEP_NAMES[$i]}" == "$CURRENT_STEP" ]]; then
      STEP_IDX=$i
      break
    fi
  done

  if [[ "$STEP_IDX" -lt 0 ]]; then
    die "Could not find step '${CURRENT_STEP}' in workflow"
  fi

  STEP_NUM="${STEP_NUMBERS[$STEP_IDX]}"
  STEP_NAME="${STEP_NAMES[$STEP_IDX]}"
  PROMPT_FILE="${PROMPT_FILES[$STEP_IDX]}"
  OUTPUT_FILE="${RUN_DIR}/step-${STEP_NUM}-output.md"

  # Print iteration header
  if $SHOW_ITER_HEADER; then
    echo ""
    echo -e "${BOLD}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ITERATION ${ITERATION} ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${RESET}"
    SHOW_ITER_HEADER=false
    ITER_START=$(date +%s)
  fi

  # Log step start
  STEP_START=$(date +%s)
  if [[ -n "$REDO_FROM" ]]; then
    log_step "${STEP_NAME} (redo from ${REDO_FROM})"
    REDO_FROM=""
  else
    log_step "${STEP_NAME}"
  fi

  # Parse model from frontmatter
  MODEL_KEY=$(parse_frontmatter_model "$PROMPT_FILE")
  MODEL_ID="${MODEL_MAP[$MODEL_KEY]:-${MODEL_MAP[$DEFAULT_MODEL]}}"

  # Build prompt content (frontmatter stripped)
  PROMPT_CONTENT=$(strip_frontmatter "$PROMPT_FILE")

  # List available step outputs
  AVAILABLE_OUTPUTS=""
  for sf in "${RUN_DIR}"/step-*-output.md; do
    [[ -f "$sf" ]] && AVAILABLE_OUTPUTS="${AVAILABLE_OUTPUTS}
- $(basename "$sf")"
  done
  if [[ -z "$AVAILABLE_OUTPUTS" ]]; then
    AVAILABLE_OUTPUTS="
- (none yet)"
  fi

  # List context directory contents
  CONTEXT_CONTENTS=""
  if [[ -d "${RUN_DIR}/context" ]]; then
    for cf in "${RUN_DIR}/context"/*; do
      [[ -f "$cf" ]] && CONTEXT_CONTENTS="${CONTEXT_CONTENTS}
- $(basename "$cf")"
    done
  fi
  if [[ -z "$CONTEXT_CONTENTS" ]]; then
    CONTEXT_CONTENTS="
empty"
  fi

  # Build project directory context (only when --project is used)
  PROJECT_CONTEXT=""
  if [[ "$PROJECT_DIR" != "$AI_STAFF_DIR" ]]; then
    PROJECT_CONTEXT="
### Project Directory
This workflow belongs to an external project at: \`${PROJECT_DIR}/\`
"
  fi

  # Build full prompt with injected context
  FULL_PROMPT="${PROMPT_CONTENT}

---
## Workflow Context (injected by runner)

You are step \`${STEP_NAME}\` in workflow \`${WORKFLOW_NAME}\`.
Run ID: \`${SLUG}\`
Iteration: ${ITERATION}

### Output Directory
All files for this run are at: \`${RUN_DIR}/\`
When workflow instructions reference \`<run_dir>\`, use: \`${RUN_DIR}\`

### Available Step Outputs${AVAILABLE_OUTPUTS}

### Context Directory
Shared data for this run is at: \`${RUN_DIR}/context/\`
Save any data that later steps need here (CSVs, JSON, downloaded files, etc.).
Contents:${CONTEXT_CONTENTS}

### Initial Argument
${INITIAL_ARG}
${PROJECT_CONTEXT}
### Timestamps
When updating any timestamp in \`IN-PROGRESS.md\`, run this to get the exact current time:
\`\`\`bash
bash ${AI_STAFF_DIR}/src/scripts/iso-now.sh
\`\`\`

### How to Signal Actions
Edit \`${PROGRESS_FILE}\`:
- To **redo a previous step**: set \`**next_step**\` to the step number (e.g. \`001\`)
- To **pause for human feedback**: set \`**Status**\` to \`paused\` and fill in \`**pause_reason**\`
- To **continue normally**: leave \`**next_step**\` as \`auto\`

Write your output/results to: \`${OUTPUT_FILE}\`"

  # Run Claude
  echo -e "───────────── ${DIM}Claude Output${RESET} ──────────────"

  CLAUDE_EXIT=0
  echo "$FULL_PROMPT" | claude -p \
    --dangerously-skip-permissions \
    --output-format stream-json \
    --verbose \
    --model "$MODEL_ID" \
    | parse_stream_json "$OUTPUT_FILE" || CLAUDE_EXIT=$?

  echo "──────────────────────────────────────────"

  STEP_END=$(date +%s)
  STEP_DURATION=$((STEP_END - STEP_START))

  if [[ "$CLAUDE_EXIT" -ne 0 ]]; then
    log_warn "Claude exited with code ${CLAUDE_EXIT}, continuing..."
  else
    log_ok "Step ${STEP_NUM} complete (${STEP_DURATION}s)"
  fi

  # Update progress file
  update_field "$PROGRESS_FILE" "Last Updated" "$(iso_timestamp)"
  append_history "$PROGRESS_FILE" "[Iter ${ITERATION}] ${STEP_NAME} — completed"

  # Check for interrupt
  $INTERRUPTED && break

  # Re-read IN-PROGRESS.md for redo/pause signals from Claude
  STATUS=$(read_field "$PROGRESS_FILE" "Status")
  NEXT_STEP=$(read_field "$PROGRESS_FILE" "next_step")

  if [[ "$STATUS" == "paused" ]]; then
    PAUSE_REASON=$(read_field "$PROGRESS_FILE" "pause_reason")
    echo ""
    log_warn "Paused by step ${STEP_NAME}: ${PAUSE_REASON:-no reason given}"
    echo -e "  Resume with: ${CYAN}$0 ${PROJECT_FLAG}${WORKFLOW_NAME} --resume ${SLUG}${RESET}"
    break
  fi

  if [[ "$NEXT_STEP" != "auto" ]] && [[ -n "$NEXT_STEP" ]]; then
    REDO_FROM="$STEP_NAME"
    ITER_DURATION=$(($(date +%s) - ITER_START))
    echo ""
    log_warn "Step ${STEP_NAME} requested redo → step ${NEXT_STEP}"
    echo -e "━━━ ${DIM}Iteration ${ITERATION} complete | Duration: ${ITER_DURATION}s${RESET} ━━━"
    ITERATION=$((ITERATION + 1))
    update_field "$PROGRESS_FILE" "Iteration" "$ITERATION"
    SHOW_ITER_HEADER=true
    continue
  fi

  # Advance to next step
  NEXT_IDX=$((STEP_IDX + 1))
  if [[ "$NEXT_IDX" -ge "$STEP_COUNT" ]]; then
    # All steps done — print iteration summary and mark completed
    ITER_DURATION=$(($(date +%s) - ITER_START))
    echo ""
    echo -e "━━━ ${DIM}Iteration ${ITERATION} complete | Duration: ${ITER_DURATION}s${RESET} ━━━"
    update_field "$PROGRESS_FILE" "Status" "completed"
    update_field "$PROGRESS_FILE" "Last Updated" "$(iso_timestamp)"
    log_ok "All steps completed"
    break
  fi

  CURRENT_STEP="${STEP_NAMES[$NEXT_IDX]}"
  update_field "$PROGRESS_FILE" "Current Step" "$CURRENT_STEP"
done

# ── Summary ──────────────────────────────────────────────────────────
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
FINAL_STATUS=$(read_field "$PROGRESS_FILE" "Status")

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  Workflow:   ${WORKFLOW_NAME}"
echo -e "  Run ID:     ${SLUG}"
echo -e "  Iterations: ${ITERATION}"
echo -e "  Duration:   ${TOTAL_DURATION}s"
echo -e "  Status:     ${FINAL_STATUS}"
echo -e "  Output:     ${RUN_DIR}/"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
