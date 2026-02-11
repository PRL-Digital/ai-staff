#!/usr/bin/env bash
# Outputs the current date/time as a UTC ISO 8601 string.
# Usage: bash src/scripts/iso-now.sh
date -u '+%Y-%m-%dT%H:%M:%SZ'
