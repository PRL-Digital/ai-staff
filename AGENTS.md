## Browser Automation

Use `playwright-cli` for web automation. Run `playwright-cli --help` for all commands.

Core workflow:
1. `playwright-cli open <url>` - Navigate to page
2. `playwright-cli snapshot` - Get interactive elements with refs (@e1, @e2)
3. `playwright-cli click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes



