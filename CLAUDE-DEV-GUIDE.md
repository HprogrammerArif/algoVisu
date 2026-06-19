# Claude Code — Developer Tips, Tricks & Workflow Guide

A practical reference for working with Claude Code day-to-day. This file is for
**you**, the developer — Claude does not need to read it (that's what `CLAUDE.md`
is for).

---

## 1. The two files you should know

| File | Who reads it | Purpose |
|------|-------------|---------|
| `CLAUDE.md` | **Claude, automatically, every session** | Project rules, stack, conventions, "always do X" instructions. This is your "Claude rules" file. |
| `CLAUDE-DEV-GUIDE.md` (this file) | You | Your personal cheat sheet. |

There can be **multiple `CLAUDE.md` files**, and they stack:

- **Project:** `./CLAUDE.md` (this repo) — shared, commit it to git.
- **Project-local (private):** `./CLAUDE.local.md` — your personal overrides, add it
  to `.gitignore`.
- **Global (all projects):** `~/.claude/CLAUDE.md` — rules that follow you across
  *every* project on your machine.

**Rule of thumb:** keep `CLAUDE.md` short and factual. Long, vague rules files get
diluted and ignored. Put "what the project is + how to run it + hard rules" only.

You can quickly add a rule mid-session by typing a line starting with `#` — Claude
will offer to save it to a memory/CLAUDE file.

---

## 2. Memory — how Claude "remembers" things

Claude has **two** kinds of memory. Don't confuse them:

### a) `CLAUDE.md` (the rules file) — deterministic
Always loaded, every session. Use it for **stable facts and rules**: stack, run
commands, conventions, "never do X." This is the reliable one.

### b) Persistent memory files — recall-based
Claude can save individual "facts" (about you, your preferences, project goals) to a
memory folder and recall them later. Use it for softer context like "I prefer
concise answers" or "this project is for a university IDP submission."

**How to use memory in practice:**
- Just tell Claude: *"Remember that I prefer vanilla JS and short explanations."*
- Or start a message with `#` to pin a quick rule.
- To make something a **hard, every-time rule**, put it in `CLAUDE.md`, not memory.
  Memory is recalled when relevant; `CLAUDE.md` is always on.

> Important: "remember to ALWAYS do X automatically" (like auto-running a command
> after every edit) is **not** a memory task — that needs a **hook** (see §6).

---

## 3. Resuming work the next day (when tokens/limits reset)

This is the big one you asked about. If you run out of usage mid-task and want to
pick up tomorrow:

### The key idea
Claude Code conversations are **saved locally and resumable.** You don't lose your
work or context when you close the terminal — you reopen the same session.

### Commands
- `claude --continue` (or `claude -c`) — resume your **most recent** conversation in
  this folder, with full context intact.
- `claude --resume` (or `claude -r`) — show a **list** of past conversations to pick
  from.
- In the VS Code extension / app: reopen the project and select the previous
  conversation from the history.

### Best practice before you stop for the day
Because a brand-new day might start a fresh context, leave yourself a breadcrumb:

1. **Ask Claude to summarize state before you quit:**
   > "Summarize what we did, what's left, and the exact next step. Write it to
   > `PROGRESS.md`."
   Then tomorrow: *"Read PROGRESS.md and continue."* This works even if context was
   trimmed or you start a new session.

2. **Commit work-in-progress** (if you use git):
   `git add -A && git commit -m "WIP: <what's done>"`. A commit is the most durable
   "save point."

3. **Use a todo list.** Ask Claude to keep a running task list; it persists in the
   session and survives context summarization.

### What happens to long conversations
When a chat gets very long, Claude **auto-summarizes** older context so work
continues seamlessly — you don't need to wrap up early. But a written
`PROGRESS.md` + a git commit is still the safest cross-day handoff.

---

## 4. Writing good prompts (gets you 80% of the value)

- **Be specific about the file:** "In `js/visualizers.js`, the grid renderer..."
  beats "fix the visualizer."
- **State the goal, not just the symptom:** "I want backward stepping to restore the
  exact array colors" is better than "stepping is broken."
- **One task per request** when possible. Big multi-part asks get muddy.
- **Ask for a plan first on big changes:** "Plan this before writing code." Review
  the plan, then say "go."
- **Tell it the constraints:** "vanilla JS only, no new files" — or it lives in
  `CLAUDE.md` so you never repeat yourself.
- **Paste errors verbatim.** The full error text is gold.
- **Point at examples:** "Do it like the array visualizer does."

---

## 5. Useful slash commands & shortcuts

> Type `/` in Claude Code to see what's available. Common ones:

- `/init` — scaffold/refresh a `CLAUDE.md` by scanning the codebase.
- `/clear` — wipe the current conversation context and start fresh (do this between
  unrelated tasks to keep Claude sharp and save tokens).
- `/compact` — manually compress the conversation to free up context while keeping a
  summary.
- `/review` — review a pull request.
- `/code-review` — review your current uncommitted/branch changes for bugs.
- `/security-review` — security pass over pending changes.
- `/config` — change settings (model, theme, etc.).
- `/fast` — toggle faster Opus output.
- `Esc` — interrupt Claude mid-action.
- `Esc Esc` (double) — rewind/edit a previous message.
- Drag a file or paste an image into the prompt for visual/context input.

**Plan Mode:** ask Claude to "enter plan mode" (or use the shortcut) for
read-only investigation + a proposed plan **before** it touches any files. Great for
risky or large changes.

---

## 6. Hooks — automate "every time" behaviors

If you want something to happen **automatically and deterministically** (not "please
remember to"), use a **hook**. Hooks are commands the harness runs on events.

Examples:
- Run a formatter/linter after every file edit.
- Print a reminder when Claude finishes.
- Block edits to certain files.

How: ask Claude *"set up a hook that runs X after I edit a file"* (it edits
`.claude/settings.json`), or run `/config`. Memory/CLAUDE.md **cannot** do this —
only hooks execute commands automatically.

---

## 7. Permissions & reducing prompts

Claude asks before running commands. To cut down repetitive approvals:

- Approve "always" for safe, frequent commands when prompted.
- Maintain an **allowlist** in `.claude/settings.json` (project) so trusted commands
  (e.g. a static server) don't prompt each time.
- There's a helper to auto-build this from your history — ask Claude to "reduce
  permission prompts" and it'll scan and propose an allowlist.

Keep destructive commands (force push, `rm -rf`, hard reset) **off** the allowlist.

---

## 8. Subagents & parallel work (when you scale up)

- Claude can spawn **subagents** for big fan-out research ("search the whole codebase
  for X") or parallel tasks. You usually don't need this for a small project, but
  it's there: just ask "use a subagent to..." when a task is large or isolated.
- **Worktrees:** for risky changes, Claude can work in an isolated git worktree so
  your main checkout stays clean.

---

## 9. Git workflow tips

- Claude won't commit or push unless you ask — by design.
- When you ask it to commit, it branches off `master` first if needed.
- Good habit: **commit at the end of each working session.** It's your real save
  point across days and the cleanest way to review what changed.
- Ask "show me the diff" before committing if you want to eyeball changes.

---

## 10. A clean daily loop (putting it together)

**Start of day**
1. Open the project, run `claude --continue` (or pick the session from history).
2. "Read `PROGRESS.md` and continue where we left off."

**During work**
3. One focused task at a time. Use Plan Mode for anything big.
4. `/clear` when you switch to an unrelated task (keeps context tight, saves tokens).

**End of day (or when limits hit)**
5. "Summarize progress + next steps into `PROGRESS.md`."
6. `git add -A && git commit -m "WIP: ..."`.
7. Close it. Tomorrow, resume from step 1 — nothing is lost.

---

### TL;DR
- **Rules that always apply → `CLAUDE.md`** (you've got one now).
- **Soft context → memory** ("remember that...").
- **Automatic actions → hooks**, not memory.
- **Resume work →** `claude --continue`, plus a `PROGRESS.md` + a WIP commit as your
  cross-day safety net.
- **Stay sharp/save tokens →** `/clear` between tasks, `/compact` when long.
