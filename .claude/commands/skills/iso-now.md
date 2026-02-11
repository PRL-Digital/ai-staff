---
name: iso-now
description: Gets the exact current date and time as a UTC ISO 8601 string. Use this whenever you need to write a timestamp — especially when updating IN-PROGRESS.md fields like Last Updated, Started, or any other time field.
allowed-tools: Bash(bash src/scripts/iso-now.sh)
---

# ISO Timestamp Helper

Get the current UTC timestamp by running:

```bash
bash src/scripts/iso-now.sh
```

This outputs a string like `2026-02-11T10:30:00Z`.

## When to Use

Always call this **before** writing any timestamp into `IN-PROGRESS.md` or other workflow files. Do not guess or hardcode the time — run the script to get the exact current moment.

## Example

```bash
$ bash src/scripts/iso-now.sh
2026-02-11T14:22:07Z
```

Then use the returned value when editing fields like `**Last Updated**` or `**Started**`.
