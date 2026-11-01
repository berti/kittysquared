#!/usr/bin/env python3
"""
Custom status line script for Antigravity CLI (agy).
Receives agent state JSON on stdin and prints formatted status line to stdout.
"""

import json
import os
import subprocess
import sys


# ANSI color codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

# Foreground colors
FG_CYAN = "\033[36m"
FG_GREEN = "\033[32m"
FG_YELLOW = "\033[33m"
FG_RED = "\033[31m"
FG_MAGENTA = "\033[35m"
FG_WHITE = "\033[37m"
FG_GRAY = "\033[90m"


def format_colored_bar(
    fraction: float, width: int = 6, invert_color: bool = False
) -> tuple[str, str]:
    """
    Renders a dynamic progress bar [████░░] with color transitions.

    Args:
        fraction: Value between 0.0 and 1.0.
        width: Total block width of the bar.
        invert_color:
            - False (Context usage): Higher fraction = fuller = caution/warning.
              < 50% -> Green, 50-80% -> Yellow, > 80% -> Red.
            - True (Quota remaining): Lower fraction = emptier = caution/warning.
              > 50% -> Green, 20-50% -> Yellow, < 20% -> Red.
    """
    fraction = max(0.0, min(1.0, fraction))
    filled_len = int(round(width * fraction))
    empty_len = width - filled_len

    if not invert_color:
        if fraction > 0.80:
            color = FG_RED
        elif fraction > 0.50:
            color = FG_YELLOW
        else:
            color = FG_GREEN
    else:
        if fraction < 0.20:
            color = FG_RED
        elif fraction < 0.50:
            color = FG_YELLOW
        else:
            color = FG_GREEN

    filled_blocks = f"{color}{'█' * filled_len}{RESET}"
    empty_blocks = f"{FG_GRAY}{'░' * empty_len}{RESET}"
    bracket_bar = f"{FG_GRAY}[{RESET}{filled_blocks}{empty_blocks}{FG_GRAY}]{RESET}"

    return bracket_bar, color


def format_reset_time(seconds: int) -> str:
    """Formats seconds into human-readable countdown like 2d 1h, 3h 15m, or 42m."""
    if seconds <= 0:
        return "now"
    days = seconds // 86400
    rem = seconds % 86400
    hours = rem // 3600
    minutes = (rem % 3600) // 60

    if days > 0:
        return f"{days}d {hours}h"
    if hours > 0:
        return f"{hours}h {minutes}m"
    if minutes > 0:
        return f"{minutes}m"
    return f"{seconds}s"


def get_git_info(data: dict) -> tuple[str, bool]:
    """Retrieves branch name and dirty status from payload or local git."""
    vcs = data.get("vcs") or {}
    branch = vcs.get("branch")
    dirty = bool(vcs.get("dirty", False))

    if not branch:
        cwd = data.get("cwd") or os.getcwd()
        try:
            res = subprocess.run(
                ["git", "-C", cwd, "rev-parse", "--abbrev-ref", "HEAD"],
                capture_output=True,
                text=True,
                timeout=1,
            )
            if res.returncode == 0:
                branch = res.stdout.strip()
                diff_res = subprocess.run(
                    ["git", "-C", cwd, "status", "--porcelain"],
                    capture_output=True,
                    text=True,
                    timeout=1,
                )
                dirty = bool(diff_res.stdout.strip())
        except Exception:
            branch = ""

    return branch, dirty


def get_model_family(data: dict) -> str:
    """Identifies the active model family (e.g. 'gemini' or '3p')."""
    model_obj = data.get("model") or {}
    if isinstance(model_obj, dict):
        m = (
            (model_obj.get("id") or "")
            + " "
            + (model_obj.get("display_name") or "")
        ).lower()
    else:
        m = str(model_obj).lower()

    if any(k in m for k in ["claude", "sonnet", "opus", "haiku", "gpt", "openai"]):
        return "3p"
    if any(k in m for k in ["gemini", "flash", "pro"]):
        return "gemini"
    return "gemini"


def extract_model_quotas(data: dict) -> list[dict]:
    """
    Extracts relevant quota limits (e.g. 5-hour and weekly) for the current model family.
    Returns a list of dicts with keys: 'label', 'icon', 'fraction', 'reset_seconds'.
    """
    quota_raw = data.get("quota") or data.get("quotas") or {}
    if not isinstance(quota_raw, dict):
        return []

    # If flat quota object
    if "remaining_fraction" in quota_raw or "remaining_amount" in quota_raw:
        frac = quota_raw.get("remaining_fraction")
        if frac is None and quota_raw.get("remaining_amount") is not None:
            frac = float(quota_raw["remaining_amount"])
        if frac is not None:
            return [{
                "label": "Quota",
                "icon": "⚡",
                "fraction": float(frac),
                "reset_seconds": quota_raw.get("reset_in_seconds"),
            }]

    family = get_model_family(data)

    bucket_5h = None
    bucket_weekly = None

    for key, bucket in quota_raw.items():
        if not isinstance(bucket, dict):
            continue
        kl = key.lower()
        if family in kl or (family == "3p" and "3p" in kl):
            if "5h" in kl or "5-h" in kl:
                bucket_5h = bucket
            elif "weekly" in kl and "argon" not in kl:
                bucket_weekly = bucket

    if not bucket_weekly:
        for key, bucket in quota_raw.items():
            if (
                isinstance(bucket, dict)
                and family in key.lower()
                and "weekly" in key.lower()
            ):
                bucket_weekly = bucket
                break

    results = []
    if bucket_5h and "remaining_fraction" in bucket_5h:
        results.append({
            "label": "5h",
            "icon": "⚡",
            "fraction": float(bucket_5h["remaining_fraction"]),
            "reset_seconds": bucket_5h.get("reset_in_seconds"),
        })

    if bucket_weekly and "remaining_fraction" in bucket_weekly:
        results.append({
            "label": "Weekly",
            "icon": "📅",
            "fraction": float(bucket_weekly["remaining_fraction"]),
            "reset_seconds": bucket_weekly.get("reset_in_seconds"),
        })

    if not results:
        for key, bucket in quota_raw.items():
            if isinstance(bucket, dict) and "remaining_fraction" in bucket:
                results.append({
                    "label": key,
                    "icon": "⚡",
                    "fraction": float(bucket["remaining_fraction"]),
                    "reset_seconds": bucket.get("reset_in_seconds"),
                })
                break

    return results


def main():
    try:
        raw_input = sys.stdin.read().strip()
        data = json.loads(raw_input) if raw_input else {}
        try:
            with open("/tmp/antigravity_statusline_debug.json", "w") as f:
                f.write(raw_input)
        except Exception:
            pass
    except Exception:
        data = {}

    sep = f" {FG_GRAY}│{RESET} "
    term_width = data.get("terminal_width") or 80

    # ---------------------------------------------------------
    # Line 1: Model, Edit Mode, Git Branch, Context Window, Vim
    # ---------------------------------------------------------
    line1_segments = []

    # 1. Model Display
    model_obj = data.get("model") or {}
    model_name = ""
    if isinstance(model_obj, dict):
        model_name = model_obj.get("display_name") or model_obj.get("id") or ""
    elif isinstance(model_obj, str):
        model_name = model_obj

    if model_name:
        line1_segments.append(f"{FG_MAGENTA}{BOLD}🤖 {model_name}{RESET}")

    # 2. Edit / Execution Mode (between Model and Branch)
    edit_mode = data.get("cycle_mode") or data.get("mode") or ""
    if edit_mode:
        mode_icons = {
            "auto": "🛠️",
            "accept-edits": "✏️",
            "plan": "📋",
        }
        icon = mode_icons.get(edit_mode.lower(), "⚙️")
        mode_color = (
            FG_GREEN
            if edit_mode.lower() == "auto"
            else (
                FG_YELLOW
                if edit_mode.lower() == "accept-edits"
                else FG_CYAN
            )
        )
        line1_segments.append(f"{icon} {mode_color}{edit_mode}{RESET}")

    # 3. Git Branch
    branch, dirty = get_git_info(data)
    if branch:
        branch_icon = "⎇ "
        if dirty:
            branch_str = f"{FG_YELLOW}{branch_icon}{branch}*{RESET}"
        else:
            branch_str = f"{FG_CYAN}{branch_icon}{branch}{RESET}"
        line1_segments.append(branch_str)

    # 4. Context Window Usage
    ctx = data.get("context_window") or {}
    used_pct = ctx.get("used_percentage")
    total_tokens = ctx.get("total_input_tokens") or ctx.get("total_tokens")
    ctx_size = ctx.get("context_window_size")

    if used_pct is not None:
        try:
            pct_val = float(used_pct)
            frac = pct_val / 100.0
            bar_str, color = format_colored_bar(
                frac, width=6, invert_color=False
            )

            token_detail = ""
            if (
                total_tokens is not None
                and ctx_size is not None
                and ctx_size > 0
            ):
                token_detail = f" {DIM}({total_tokens // 1000}k/{ctx_size // 1000}k){RESET}"

            line1_segments.append(
                f"🧠 {bar_str} {color}{BOLD}{pct_val:.1f}%{RESET}{token_detail}"
            )
        except (ValueError, TypeError):
            pass

    # 5. Vim Mode
    vim = data.get("vim") or {}
    vim_mode = vim.get("mode")
    if vim_mode:
        line1_segments.append(f"⌨️  {FG_WHITE}{BOLD}[{vim_mode}]{RESET}")

    # ---------------------------------------------------------
    # Line 2: Quota Limits (5h, Weekly), Tasks, Plan Tier
    # ---------------------------------------------------------
    line2_segments = []
    quotas = extract_model_quotas(data)

    for q in quotas:
        frac = q["fraction"]
        pct = int(round(frac * 100))
        bar_str, color = format_colored_bar(frac, width=6, invert_color=True)
        reset_str = ""
        if q["reset_seconds"] and q["reset_seconds"] > 0:
            reset_str = f" {DIM}↺ {format_reset_time(q['reset_seconds'])}{RESET}"

        line2_segments.append(
            f"{q['icon']} {q['label']}: {bar_str} {color}{BOLD}{pct:.0f}%{RESET}{reset_str}"
        )

    # Fallback to credits if no quota was extracted
    if not quotas:
        credits_info = data.get("credits") or {}
        ai_credits = credits_info.get("ai_credits_remaining")
        if ai_credits is not None:
            line2_segments.append(f"🪙 Credits: {FG_GREEN}{BOLD}{ai_credits}{RESET}")

    # Optional default statusline indicators: Artifacts & Background Tasks
    artifact_count = data.get("artifact_count")
    if artifact_count and int(artifact_count) > 0:
        line2_segments.append(f"📄 {artifact_count} artifact{'s' if artifact_count > 1 else ''}")

    task_count = data.get("task_count")
    if task_count and int(task_count) > 0:
        line2_segments.append(f"⚙️ {task_count} task{'s' if task_count > 1 else ''}")

    # Sandbox indicator if sandbox is active
    sandbox_info = data.get("sandbox") or {}
    if sandbox_info.get("enabled"):
        line2_segments.append(f"📦 {FG_YELLOW}sandbox{RESET}")

    # Subscription plan badge
    plan_tier = data.get("plan_tier")
    if plan_tier and term_width >= 90:
        line2_segments.append(f"🛡️ {FG_CYAN}{BOLD}{plan_tier}{RESET}")

    # Print output
    if line1_segments:
        print(sep.join(line1_segments))
    if line2_segments:
        print(sep.join(line2_segments))
    if not line1_segments and not line2_segments:
        print(f"{FG_GRAY}Antigravity CLI{RESET}")


if __name__ == "__main__":
    main()
