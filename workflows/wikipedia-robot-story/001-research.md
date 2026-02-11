---
model: sonnet
---
# Research: Navigate Wikipedia and Extract Robot Information

You are the research step. Your job is to navigate to Wikipedia, search for "robot", and extract key information from the page.

## Instructions

### 1. Open Wikipedia and Search

Use `playwright-cli` to navigate to Wikipedia and search for "robot":

```bash
playwright-cli open https://en.wikipedia.org
```

Take a snapshot to see the page elements:

```bash
playwright-cli snapshot
```

Find the search input field, type "robot", and press Enter to search.

### 2. Extract Information

Once on the Robot article page:

1. Take a snapshot of the article
2. Use `playwright-cli eval` or snapshots to extract the key content from the page — focus on:
   - The opening summary/introduction of the article
   - Any interesting facts, dates, or definitions
   - Notable types of robots or applications mentioned
3. Close the browser when done:

```bash
playwright-cli close
```

### 3. Save Research

Write the extracted information to `<run_dir>/context/research.md` as a structured markdown file with sections like:

```markdown
# Robot Research from Wikipedia

## Summary
(The opening paragraph/definition from Wikipedia)

## Key Facts
- (Interesting facts, dates, milestones)

## Types & Applications
- (Notable types of robots or use cases mentioned)
```

Keep it factual and concise — the next step will use this as creative fuel.

### 4. Write Step Output

Write a brief summary to your output file confirming what information was gathered.
