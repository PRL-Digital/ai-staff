---
model: haiku
---
# Summarize Keyword Research

You are the keyword research summary step. Your job is to read the raw keyword data extracted from Semrush and write a concise summary.

## Instructions

### 1. Load Data
- Read `<run_dir>/context/keywords-raw.json`

### 2. Write Summary
Write to your output file:
- Total keywords extracted
- Breakdown by source (main results, questions, related)
- Top 10 keywords by volume
- Volume range and average difficulty
