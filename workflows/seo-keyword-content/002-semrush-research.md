# Semrush Keyword Research

You are the keyword research step. Your job is to use browser automation to research keywords on Semrush's Keyword Magic Tool and extract structured data.

## Instructions

### 1. Load Session
- Run `playwright-cli state-load semrush-session` to restore the saved Semrush session
- Navigate to `https://www.semrush.com/analytics/keywordmagic/` to verify you're logged in
- Take a snapshot to confirm the page loaded correctly
- **If the session is expired or missing**: Set `**Status**` to `paused` and `**pause_reason**` to `Semrush session expired or missing. Please log in manually: run "playwright-cli open https://www.semrush.com/login" in a terminal, log in, then run "playwright-cli state-save semrush-session". Resume with --resume.`

### 2. Research Keywords
- Read `<run_dir>/context/input.json` to get the `query`
- Enter the query into the Keyword Magic Tool search box and submit
- Wait for results to load, then snapshot the page

### 3. Extract Data
For each keyword result visible, extract:
- **Keyword** — the search term
- **Search Volume** — monthly search volume
- **Keyword Difficulty (KD%)** — difficulty score
- **CPC** — cost per click
- **Intent** — search intent (informational, commercial, transactional, navigational)
- **SERP Features** — any special SERP features noted

Also look for:
- **Questions tab** — click it if available and extract question-based keywords
- **Related tab** — extract related topic keywords
- Handle pagination: if there are multiple pages of results, navigate through them (up to 3-5 pages to keep it reasonable)

### 4. Save Results
- Save all extracted keyword data to `<run_dir>/context/keywords-raw.json` as a JSON object:
  ```json
  {
    "query": "the original query",
    "extracted_at": "ISO timestamp",
    "total_results": 150,
    "keywords": [
      {
        "keyword": "example term",
        "volume": 1200,
        "difficulty": 45,
        "cpc": 1.50,
        "intent": "commercial",
        "serp_features": ["featured_snippet", "people_also_ask"],
        "source": "main|questions|related"
      }
    ]
  }
  ```

## Tips
- After each page interaction, re-snapshot to get updated refs
- If Semrush shows a captcha or rate limit, pause the workflow with clear instructions
- Don't rush — wait for elements to fully load before extracting
- If a column isn't visible in the table, look for options to customize visible columns
