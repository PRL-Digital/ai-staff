---
model: haiku
---
# Report on Filtered Keywords

You are the keyword filtering report step. Your job is to read the filtered keyword data and write a clear summary of what was kept, removed, and why.

## Instructions

### 1. Load Data
- Read `<run_dir>/context/keywords-filtered.json`
- Read `<run_dir>/context/keywords-raw.json` for comparison

### 2. Write Report
Write to your output file:
- How many keywords were removed and why (by category)
- The top 20 keywords with their scores
- Primary keywords (3-5 to target most aggressively)
- Secondary keywords (5-10 for supporting coverage)
- Question keywords (for FAQ sections or heading ideas)
- Any notes about keyword gaps or opportunities spotted
