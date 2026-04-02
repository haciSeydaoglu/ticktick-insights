---
name: release
description: |
  Bump patch version, commit all pending changes, and push to remote.
  
  This command is an explicit exception to the general git commit/push ban in CLAUDE.md.
  It handles the full release workflow:
  - Reads pending git changes
  - Increments patch version in js/version.js
  - Creates an English imperative commit message based on the diff
  - Commits and pushes to origin

  WHEN TO USE:
  - After completing a feature or fix and ready to ship
  - When all changes are ready to commit as a single release
---

# Release — Version Bump, Commit & Push

This command automates the TickTick Insights release workflow. It is an **explicit exception** to the general git commit/push ban defined in `CLAUDE.md`.

## Step 1: Check for Pending Changes

1. Run `git status` to see the current state
2. Run `git diff --name-only` and `git diff --cached --name-only` to list changed files
3. If there are **no changes** (working tree is clean and nothing staged), inform the user and stop — nothing to release
4. List the changed files to the user so they know what will be included

## Step 2: Read the Diff

1. Run `git diff HEAD` to get the full diff of all changes (staged + unstaged)
2. Read `js/version.js` to get the current version string (e.g., `'0.1.3'`)

## Step 3: Bump the Version

1. Parse the current version: split on `.` to get `[major, minor, patch]`
2. Increment `patch` by 1 (e.g., `0.1.3` → `0.1.4`)
3. Edit `js/version.js`: replace the `APP_VERSION` value with the new version string
4. Confirm the edit was applied correctly

## Step 4: Compose the Commit Message

Analyze the diff content and write a concise **English** commit message:
- Use imperative mood: "Add", "Fix", "Update", "Remove", "Refactor", "Improve"
- Describe **what** changed and **why** if relevant
- Keep it under 72 characters
- Do **not** mention the version bump itself — it is always implied
- Examples from this project's history:
  - `Add raw analysis output mode for AI prompts`
  - `Clarify local browser storage behavior`
  - `Add prompt context controls and app versioning`

If multiple unrelated changes exist, summarize the most significant one or use a broader description like `Update prompt builder and fix analyzer output`.

## Step 5: Commit and Push

1. Stage all changes: `git add -A`
2. Commit with the composed message (use HEREDOC to preserve formatting):
   ```
   git commit -m "$(cat <<'EOF'
   <your message here>
   EOF
   )"
   ```
3. Push to remote: `git push`
4. Report the result to the user:
   - New version number
   - Commit message used
   - Push status (success or error)
   - Short commit hash from `git log --oneline -1`
