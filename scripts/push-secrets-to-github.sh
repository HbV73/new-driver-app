#!/usr/bin/env bash
# Sets Actions secrets from this repo's .env (must exist next to package.json).
# Requires: gh CLI (https://cli.github.com) and: gh auth login
# Or: export GH_TOKEN=<classic PAT with repo scope>
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ ! -f .env ]]; then
  echo "Missing .env in $ROOT — copy from .env.example and fill values." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env
set +a
if [[ -z "${VITE_SUPABASE_URL:-}" || -z "${VITE_SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env" >&2
  exit 1
fi
REPO="HbV73/new-driver-app"
gh secret set VITE_SUPABASE_URL --repo "$REPO" -b "$VITE_SUPABASE_URL"
gh secret set VITE_SUPABASE_PUBLISHABLE_KEY --repo "$REPO" -b "$VITE_SUPABASE_PUBLISHABLE_KEY"
echo "OK: repository secrets updated for $REPO. Re-run the Android debug APK workflow."
