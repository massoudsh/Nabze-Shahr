#!/usr/bin/env bash
# Publish .github/issues/*.md as GitHub issues.
# Requires an authenticated `gh` CLI. Idempotent: skips titles that already exist.
set -euo pipefail

repo="${REPO:-$(git config --get remote.origin.url | sed -E 's#.*github\.com[:/]##; s#\.git$##')}"
issues_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.github/issues" && pwd)"

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh CLI not found. Install it, run 'gh auth login', then re-run." >&2
  exit 1
fi

command -v jq >/dev/null 2>&1 || { echo "error: jq is required." >&2; exit 1; }

existing="$(gh issue list --repo "$repo" --state all --limit 300 --json title --jq '.[].title')"

shopt -s nullglob
for file in "$issues_dir"/[0-9][0-9]-*.md; do
  title="$(head -n 1 "$file" | sed 's/^# //')"
  labels="$(sed -n 's/^<!-- labels: \(.*\) -->$/\1/p' "$file" | head -n 1)"

  if grep -Fxq "$title" <<<"$existing"; then
    echo "skip    $title"
    continue
  fi

  args=(issue create --repo "$repo" --title "$title" --body-file "$file")
  if [[ -n "$labels" ]]; then
    IFS=',' read -r -a label_list <<<"$labels"
    for label in "${label_list[@]}"; do
      args+=(--label "${label# }")
    done
  fi

  gh "${args[@]}" >/dev/null
  echo "created $title"
done
