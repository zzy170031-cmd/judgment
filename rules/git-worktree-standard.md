# Git Worktree Standard

Use this rule when Git worktrees, multiple Codex threads/workers, parallel branches, hotfixes during dirty work, isolated review/test runs, or branch checkout conflicts matter.

## Source Basis

Treat Git's official `git-worktree`, `git-branch`, `git-switch`, and `git-config` docs as command authority. Treat community guides and multi-agent coding systems as workflow examples only.

Import a pattern into Judgment only when it strengthens:

- live Git state anchoring;
- one-owner-per-branch/worktree clarity;
- dependency and shared-file coordination;
- verification before integration;
- explicit user approval for destructive, force, publish, or cleanup actions.

Do not import a blog or agent-runtime pattern if it weakens Git semantics, hides state in a daemon, bypasses sandbox or approval boundaries, or treats worktree isolation as a substitute for merge planning.

## Mental Model

- A Git worktree is a separate working directory attached to one repository object store.
- Each worktree has its own working tree, index, `HEAD`, and checked-out branch or detached commit.
- One branch normally belongs to one worktree at a time. If Git says a branch is already checked out elsewhere, treat that as a real ownership conflict.
- Linked worktrees are managed through repository metadata. Prefer `git worktree remove`, `lock`, `unlock`, `prune`, and `repair` over manual directory deletion or repair guesses.
- A linked worktree often has a `.git` file pointing at common Git metadata, not a normal `.git` directory. Scripts must use Git commands such as `git rev-parse`, not filesystem assumptions.
- Repo-level config, hooks, remotes, object storage, and submodule definitions may be shared. Per-worker changes to repo configuration, hooks, remotes, or submodule policy require explicit authorization.
- Worktree isolation gives each worker a separate index and working tree, but it does not remove code ownership, dependency, merge-conflict, build-cache, or integration risk.
- Local dependency folders, generated assets, virtualenvs, package caches, app data, background services, and ignored files may not exist in a fresh worktree. Treat each worktree as a new filesystem root until setup evidence proves otherwise.

## Live State Anchor

Before creating, assigning, cleaning, merging, pruning, or repairing worktrees, capture:

```powershell
git -C <repo> worktree list --porcelain
git -C <repo> status -sb
git -C <repo> branch -vv
git -C <repo> rev-parse --show-toplevel
git -C <repo> rev-parse --git-dir --git-common-dir
git -C <repo> log -1 --oneline --decorate
```

For scripts, prefer the stable porcelain format and use `-z` when paths may contain whitespace, newlines, or non-ASCII characters:

```powershell
git -C <repo> worktree list --porcelain -z
```

If remote freshness matters and mutation is not allowed:

```powershell
git -C <repo> ls-remote origin refs/heads/<branch>
```

If remote freshness matters and network mutation is allowed, fetch before choosing a base, integrating, or pushing:

```powershell
git -C <repo> fetch --prune origin
```

The report must name the active filesystem path, branch, `HEAD`, dirty state, Git dir/common dir, remote freshness status, and any other worktree that already owns a relevant branch.

## Config And Environment Check

Run this gate when branch guessing, sparse checkout, submodules, hooks, or per-worker config could affect behavior:

```powershell
git -C <repo> config --show-origin --get-regexp "^(extensions\.worktreeConfig|worktree\.|checkout\.defaultRemote|branch\..*\.remote|branch\..*\.merge|core\.sparseCheckout|submodule\.)"
```

Decision rules:

- Do not depend on `worktree.guessRemote` or `checkout.defaultRemote` silently. If a remote branch is intended, say which remote branch is the base.
- Use per-worktree config deliberately. If enabling or changing `extensions.worktreeConfig`, repo config, hooks, remotes, or submodule policy, get explicit authorization and report the effect on other worktrees.
- If sparse checkout is needed, prefer creating with `--no-checkout`, configuring sparse paths in the new worktree, and then checking out. Record the sparse scope.
- If submodules are part of the project, assume extra risk: initialize/update them from the assigned worktree, report submodule state, and do not move or repair submodule-heavy worktrees by guess.

## When To Use A Worktree

Use a worktree when it materially reduces risk or context pressure:

- a worker lane needs isolated file edits or tests while the controller keeps its own tree stable;
- a hotfix, release check, review, or reproduction must happen while the current worktree is dirty;
- an experiment or spike should not disturb the main task's index, untracked files, or process state;
- an independent reviewer needs a clean build/test pass from a specific commit or branch;
- a handoff/new thread should start from a clean directory while preserving the old thread's dirty state.

Do not create a worktree when a single narrow task can finish safely in the current tree, when branch ownership is unclear, or when the lane depends on untracked artifacts that are not reproducible in a fresh directory.

## Worktree Choice Matrix

Choose the lightest safe form:

| Situation | Preferred form | Notes |
|---|---|---|
| Worker needs isolated writes | New branch in new worktree | One writing worker per branch and path. |
| Review, reproduction, bisection, or artifact inspection only | Detached worktree | Read-only by default; no push target. |
| Hotfix while current tree is dirty | New hotfix branch from fresh base | Keep dirty task untouched. |
| Existing remote branch must be worked | Explicit local branch tracking that remote | Avoid implicit branch guessing unless stated. |
| Large monorepo or narrow review | `--no-checkout` plus sparse checkout | Record sparse scope before edits. |
| Long-lived, network/removable, or preserved path | Locked worktree | Include lock reason and unlock policy. |
| Lane depends on ignored/generated/local-only files | Usually avoid worktree | Recreate inputs first or state conditional equivalence. |

## Creation Protocol

Before creation, choose and record:

- `worktree_path`;
- branch name or detached commit;
- base ref;
- owner/thread;
- allowed files and forbidden files;
- merge target;
- cleanup policy.

Preferred commands:

```powershell
git -C <repo> worktree add -b <branch> <worktree_path> <base_ref>
git -C <repo> worktree add <worktree_path> <existing_branch>
git -C <repo> worktree add --detach <worktree_path> <commit_or_tag>
git -C <repo> worktree add --lock --reason "<reason>" -b <branch> <worktree_path> <base_ref>
git -C <repo> worktree add --no-checkout -b <branch> <worktree_path> <base_ref>
```

When tracking a remote branch, name the remote explicitly:

```powershell
git -C <repo> worktree add -b <branch> --track <worktree_path> origin/<remote_branch>
```

After creation, verify from the new path:

```powershell
git -C <worktree_path> status -sb
git -C <worktree_path> rev-parse HEAD
git -C <worktree_path> worktree list --porcelain
git -C <worktree_path> rev-parse --git-dir --git-common-dir
```

If submodules are part of the project, initialize/update them from the new worktree before testing. If dependencies or generated assets are local-only, state that the worktree is not yet equivalent to the source tree.

## Branch And Force Rules

- Do not assign two writing workers to the same branch or same worktree.
- Do not use `git worktree add --force`, `--ignore-other-worktrees`, branch deletion, branch reset, `git switch -C`, `git branch -f`, `git branch -D`, `git worktree remove --force`, or equivalent force actions to bypass another worktree without explicit user approval and a live-state report.
- When Git refuses a branch because it is checked out in another worktree, stop and decide: use a new branch, use a detached read-only worktree, hand off to the existing owner, or ask the user.
- Do not rebase, reset, amend, delete, or rename a branch that another active worktree owns unless the owner and user have opened that gate.
- Do not stash or clean another worktree's files from the controller tree. Run ownership checks in the target worktree path.
- Do not rely on force cleanup as routine lifecycle. Force requires target path, branch owner, dirty status, and whether the worktree is locked, missing, moved, or submodule-heavy.

## Dependency And Conflict Planning

Before dispatching parallel work, classify:

- files or directories each worker may edit;
- shared files that require serialization, such as lockfiles, migrations, generated schemas, route registries, prompt catalogs, package manifests, public snapshots, and release notes;
- dependency direction between lanes;
- setup commands and caches needed for the new worktree;
- whether test commands can run concurrently without fighting over ports, databases, temp paths, browser profiles, or build output directories.

If two workers need the same shared file, choose one:

- serialize the work;
- assign the shared file to one integration owner;
- split the branch plan so one worker produces a patch or report only;
- route through `555` or QA when the conflict can change acceptance.

Do not treat "separate worktrees" as enough when the real conflict is semantic, generated, or integration-level.

## Worker Packet Fields

When a worker thread receives a worktree task, include:

```text
repo_root:
controller_worktree:
assigned_worktree:
branch:
base_ref:
head_at_dispatch:
merge_target:
allowed_files:
forbidden_files:
allowed_git_actions:
forbidden_git_actions:
setup_commands:
verification_commands:
shared_files_policy:
report_required: status -sb, HEAD, changed files, test results, worktree list excerpt
commit_policy: forbidden / allowed after approval / required by controller
cleanup_policy: keep / remove after merge / ask controller
push_policy: forbidden / allowed after approval / required
force_policy: forbidden unless explicitly reauthorized
conflict_policy:
integration_owner:
```

Workers must run edits, tests, and Git status commands inside `assigned_worktree`, not whichever directory the shell happens to start in.

## Review And Integration

- Use detached or read-only worktrees for pure review, reproduction, bisection, or artifact inspection.
- Have the worker report exact changed files, branch, `HEAD`, verification output, and any untracked/ignored outputs that matter.
- Integrate in the controller or designated integration worktree after checking dirty state, branch ownership, remote freshness, and shared-file conflicts.
- Before merging a worker branch, verify that the worker's branch is not still dirty and that its result has passed the active QA/security/browser/release gates.
- If the worker is not authorized to commit, require a patch summary and changed-file list instead of a commit SHA.
- If the worker is authorized to commit, require branch, commit SHA, changed files, verification output, and uncommitted status after commit.
- Do not push, publish, deploy, or open external PRs from a worker branch unless that action is explicitly authorized.

## Lifecycle

Use Git-managed lifecycle commands:

```powershell
git -C <repo> worktree list --porcelain
git -C <repo> worktree lock <worktree_path> --reason "<reason>"
git -C <repo> worktree unlock <worktree_path>
git -C <repo> worktree remove <worktree_path>
git -C <repo> worktree prune --dry-run --verbose
git -C <repo> worktree prune --verbose
git -C <repo> worktree repair <path>
```

Lock long-lived, removable-drive, network-drive, or intentionally preserved worktrees with a reason. Unlock only when that reason no longer applies.

Before remove or prune, capture target status from the target path when it exists:

```powershell
git -C <worktree_path> status -sb
git -C <worktree_path> log -1 --oneline --decorate
```

Run `prune --dry-run` before pruning. Prune only stale administrative entries, not useful files. If a worktree was moved manually, use `repair` rather than deleting metadata by guess.

Branch deletion is separate from worktree removal. Do not delete the branch merely because the worktree was removed; require merge/abandon evidence and explicit approval.

## Handoff Requirements

Any Git-aware handoff or checkpoint must include worktree state when worktrees are present:

- current worktree path;
- `git worktree list --porcelain` summary;
- active branch and `HEAD` for each relevant worktree;
- dirty state per relevant worktree;
- locked/prunable/missing/moved state when relevant;
- branch ownership conflicts;
- which worktree the next thread should use;
- setup and dependency state;
- shared-file or merge-conflict risks;
- cleanup policy for temporary or worker worktrees.

Trust live Git state over the handoff packet if they disagree.
