#!/usr/bin/env bash
# Custom status line script for Antigravity CLI using jq

set -euo pipefail

# Read all of stdin
INPUT=$(cat || true)

if [ -z "$INPUT" ]; then
  INPUT="{}"
fi

# Parse payload with jq
eval "$(echo "$INPUT" | jq -r '
  @sh "MODEL=\(.model.display_name // .model.id // "")",
  @sh "BRANCH=\(.vcs.branch // "")",
  @sh "DIRTY=\(.vcs.dirty // false)",
  @sh "CTX_PCT=\(.context_window.used_percentage // "")",
  @sh "CTX_TOKENS=\(.context_window.total_tokens // "")",
  @sh "CTX_SIZE=\(.context_window.context_window_size // "")",
  @sh "QUOTA_FRAC=\(.quota.remaining_fraction // "")",
  @sh "RESET_SECS=\(.quota.reset_in_seconds // "")",
  @sh "CREDITS=\(.credits.ai_credits_remaining // "")"
' 2>/dev/null || true)"

# ANSI formatting
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_DIM="\033[2m"
C_CYAN="\033[36m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_RED="\033[31m"
C_MAGENTA="\033[35m"
C_GRAY="\033[90m"

SEP=" ${C_GRAY}│${C_RESET} "
SEGMENTS=()

# 1. Model
if [ -n "${MODEL:-}" ]; then
  SEGMENTS+=("${C_MAGENTA}${C_BOLD}🤖 ${MODEL}${C_RESET}")
fi

# 2. Git Branch
if [ -z "${BRANCH:-}" ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    DIRTY=true
  fi
fi

if [ -n "${BRANCH:-}" ]; then
  if [ "${DIRTY:-false}" = "true" ]; then
    SEGMENTS+=("${C_YELLOW}⎇ ${BRANCH}*${C_RESET}")
  else
    SEGMENTS+=("${C_CYAN}⎇ ${BRANCH}${C_RESET}")
  fi
fi

# 3. Context window usage
if [ -n "${CTX_PCT:-}" ]; then
  PCT_INT=${CTX_PCT%.*}
  COLOR="$C_GREEN"
  if [ "${PCT_INT:-0}" -gt 80 ]; then
    COLOR="$C_RED"
  elif [ "${PCT_INT:-0}" -gt 50 ]; then
    COLOR="$C_YELLOW"
  fi

  DETAIL=""
  if [ -n "${CTX_TOKENS:-}" ] && [ -n "${CTX_SIZE:-}" ]; then
    DETAIL=" ${C_DIM}($((CTX_TOKENS / 1000))k/$((CTX_SIZE / 1000))k)${C_RESET}"
  fi
  SEGMENTS+=("Ctx: ${COLOR}${C_BOLD}${CTX_PCT}%${C_RESET}${DETAIL}")
fi

# 4. Quota
if [ -n "${QUOTA_FRAC:-}" ]; then
  PCT=$(awk "BEGIN {printf \"%d\", ${QUOTA_FRAC} * 100}" 2>/dev/null || echo "0")
  COLOR="$C_GREEN"
  if [ "$PCT" -le 20 ]; then
    COLOR="$C_RED"
  elif [ "$PCT" -le 50 ]; then
    COLOR="$C_YELLOW"
  fi

  BAR_FILLED=$(( (PCT * 6) / 100 ))
  BAR_EMPTY=$(( 6 - BAR_FILLED ))
  BAR="$(head -c "$BAR_FILLED" < /dev/zero | tr '\0' '█')$(head -c "$BAR_EMPTY" < /dev/zero | tr '\0' '░')"

  RESET_STR=""
  if [ -n "${RESET_SECS:-}" ] && [ "${RESET_SECS:-0}" -gt 0 ]; then
    H=$(( RESET_SECS / 3600 ))
    M=$(( (RESET_SECS % 3600) / 60 ))
    RESET_STR=" ${C_DIM}↺ ${H}h ${M}m${C_RESET}"
  fi

  SEGMENTS+=("Quota: ${COLOR}[${BAR}] ${PCT}%${C_RESET}${RESET_STR}")
elif [ -n "${CREDITS:-}" ]; then
  SEGMENTS+=("Credits: ${C_GREEN}${C_BOLD}${CREDITS}${C_RESET}")
fi

# Output
if [ ${#SEGMENTS[@]} -gt 0 ]; then
  OUTPUT=""
  for i in "${!SEGMENTS[@]}"; do
    if [ "$i" -gt 0 ]; then
      OUTPUT="${OUTPUT}${SEP}"
    fi
    OUTPUT="${OUTPUT}${SEGMENTS[$i]}"
  done
  echo -e "$OUTPUT"
else
  echo -e "${C_GRAY}Antigravity CLI${C_RESET}"
fi
