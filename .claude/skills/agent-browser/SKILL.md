---
name: agent-browser
description: Automates browser interactions for web testing, form filling, screenshots, and data extraction. Use when the user needs to navigate websites, interact with web pages, fill forms, take screenshots, test web applications, or extract information from web pages.
allowed-tools: Bash(agent-browser:*)
---

# Browser Automation with agent-browser

## Quick start

```bash
# open new browser and navigate
agent-browser open https://example.com
# get interactive elements with refs
agent-browser snapshot
# interact using @refs from the snapshot
agent-browser click @e2
agent-browser fill @e3 "search query"
agent-browser press Enter
# take a screenshot
agent-browser screenshot
# close the browser
agent-browser close
```

## Commands

### Core

```bash
agent-browser open https://example.com/
agent-browser click @e3
agent-browser dblclick @e7
agent-browser fill @e5 "user@example.com"
agent-browser type @e5 "text"
agent-browser drag @e2 @e8
agent-browser hover @e4
agent-browser focus @e4
agent-browser select @e9 "option-value"
agent-browser check @e12
agent-browser uncheck @e12
agent-browser upload @e1 ./document.pdf
agent-browser download @e1 ./file.zip
agent-browser scroll down 500
agent-browser scrollintoview @e6
agent-browser wait @e3
agent-browser wait 2000
agent-browser snapshot
agent-browser eval "document.title"
agent-browser close
```

### Navigation

```bash
agent-browser back
agent-browser forward
agent-browser reload
```

### Keyboard

```bash
agent-browser press Enter
agent-browser press ArrowDown
agent-browser press Control+a
```

### Mouse

```bash
agent-browser mouse move 150 300
agent-browser mouse down
agent-browser mouse down right
agent-browser mouse up
agent-browser mouse up right
agent-browser mouse wheel 100
```

### Get Info

```bash
agent-browser get text @e1
agent-browser get html @e1
agent-browser get value @e3
agent-browser get attr name @e5
agent-browser get title
agent-browser get url
agent-browser get count @e1
agent-browser get box @e1
agent-browser get styles @e1
```

### Check State

```bash
agent-browser is visible @e1
agent-browser is enabled @e3
agent-browser is checked @e5
```

### Find Elements

```bash
agent-browser find role button click --name Submit
agent-browser find text "Hello" click
agent-browser find label "Email" fill "user@example.com"
agent-browser find placeholder "Search" fill "query"
agent-browser find testid "submit-btn" click
```

### Screenshots & PDF

```bash
agent-browser screenshot
agent-browser screenshot page.png
agent-browser screenshot --full
agent-browser pdf page.pdf
```

### Tabs

```bash
agent-browser tab list
agent-browser tab new
agent-browser tab new https://example.com/page
agent-browser tab close
agent-browser tab close 2
agent-browser tab 0
```

### Browser Settings

```bash
agent-browser set viewport 1920 1080
agent-browser set device "iPhone 15 Pro"
agent-browser set geo 37.7749 -122.4194
agent-browser set offline on
agent-browser set headers '{"X-Custom": "value"}'
agent-browser set credentials user pass
agent-browser set media dark
```

### Storage

```bash
agent-browser cookies
agent-browser cookies get session_id
agent-browser cookies set session_id abc123 --domain=example.com --httpOnly --secure
agent-browser cookies clear

agent-browser storage local get theme
agent-browser storage local set theme dark
agent-browser storage local clear
agent-browser storage session get step
agent-browser storage session clear
```

### Network

```bash
agent-browser network route "**/*.jpg" --abort
agent-browser network route "https://api.example.com/**" --body='{"mock": true}'
agent-browser network unroute "**/*.jpg"
agent-browser network unroute
agent-browser network requests
agent-browser network requests --filter "api"
```

### Debug

```bash
agent-browser console
agent-browser errors
agent-browser highlight @e3
agent-browser trace start
agent-browser trace stop trace.zip
agent-browser record start video.webm
agent-browser record stop
```

### Sessions

```bash
# use a named session
agent-browser --session mysession open https://example.com
agent-browser --session mysession click @e6
agent-browser --session mysession close

agent-browser session list
```

### Configuration

```bash
# Use specific browser
agent-browser --browser chromium open https://example.com
agent-browser --browser firefox open https://example.com

# Use persistent profile
agent-browser --profile /path/to/profile open https://example.com

# Show browser window
agent-browser --headed open https://example.com

# Connect via CDP
agent-browser --cdp 9222 snapshot
agent-browser connect 9222

# Install browser
agent-browser install
```

## Example: Form submission

```bash
agent-browser open https://example.com/form
agent-browser snapshot

agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser snapshot
agent-browser close
```

## Example: Multi-tab workflow

```bash
agent-browser open https://example.com
agent-browser tab new https://example.com/other
agent-browser tab list
agent-browser tab 0
agent-browser snapshot
agent-browser close
```
