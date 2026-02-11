---
model: sonnet
---
# Filter & Rank Keywords

You are the keyword filtering step. Your job is to take the raw keyword data from Semrush and filter it down to the most relevant, actionable keywords for content optimization.

## Instructions

### 1. Load Data
- Read `<run_dir>/context/keywords-raw.json` for the full keyword list
- Read `<run_dir>/context/input.json` for the query, content_type, target_audience, and notes

### 2. Filter Keywords
Remove keywords that are:
- **Off-topic**: Not relevant to the primary query or content type
- **Duplicates**: Same keyword with slight variations (keep the higher-volume version)
- **Too broad**: Generic single words that lack specificity
- **Too narrow**: Hyper-specific long-tail with near-zero volume (unless strategically valuable)
- **Competitor brands**: If `notes` mentions avoiding competitor brands, remove branded terms
- **Irrelevant intent**: Filter based on content type — e.g. for a service page, prioritize commercial/transactional intent over purely informational

### 3. Apply User Instructions
- Parse the `notes` field for any specific filtering guidance
- Use `target_audience` to assess relevance — keywords should match what this audience would search for
- Use `content_type` as a signal — a "service" page needs different keywords than a "resource" or "blog" page

### 4. Score & Rank
Create a composite relevance score for each remaining keyword based on:
- **Relevance** (0-10): How closely it matches the topic and audience intent
- **Volume weight**: Higher volume = better, but don't ignore valuable low-volume terms
- **Difficulty discount**: Lower difficulty = easier to rank = higher score
- **Intent match**: Keywords whose intent matches the content type score higher

Formula suggestion: `score = relevance * 3 + log10(volume + 1) * 2 + (100 - difficulty) / 20 + intent_bonus`

### 5. Save Results
Save to `<run_dir>/context/keywords-filtered.json`:
```json
{
  "query": "original query",
  "filtered_at": "ISO timestamp",
  "original_count": 150,
  "filtered_count": 45,
  "removed_count": 105,
  "keywords": [
    {
      "keyword": "example term",
      "volume": 1200,
      "difficulty": 45,
      "cpc": 1.50,
      "intent": "commercial",
      "relevance_score": 8.5,
      "composite_score": 34.2,
      "source": "main",
      "category": "primary|secondary|long-tail|question"
    }
  ],
  "primary_keywords": ["top 3-5 keywords to target"],
  "secondary_keywords": ["next 5-10 supporting keywords"],
  "question_keywords": ["question-format keywords for FAQ/content sections"],
  "removal_summary": {
    "off_topic": 40,
    "duplicates": 25,
    "too_broad": 10,
    "too_narrow": 15,
    "competitor_brands": 5,
    "wrong_intent": 10
  }
}
```
