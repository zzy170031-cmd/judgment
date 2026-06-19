# Git Worktree Standard

Use this rule when Git worktrees, multiple Codex threads/workers, parallel branches, hotfixes during dirty work, isolated review/test runs, or branch checkout conflicts matter.

## Source Basis

Treat Git's official `git-worktree`, `git-branch`, `git-switch`, and `git-config` docs as command authority. Treat community guides as workflow examples only. Do not import a blog pattern into Judgment if it weakens Git state anchoring, ownership clarity, or user approval boundaries.

## Mental Model

- A Git worktree is a separate working directory attached to one repository object store.
- Each worktree has its own working tree, index, `HEAD`, and checked-out branch or detached commit.
- One branch normally belongs to one worktree at a time. If Git says a branch is already checked out elsewhere, treat that as a real ownership conflict.
- Linked worktrees are managed through repository metadata. Prefer `git worktree remove`, `lock`, `unlock`, `prune`, and `repair` over manual directory deletion or repair guesses.
- A linked worktree often has a `.git` file pointing at common Git metadata, not a normal `.git` directory. Scripts must use Git commands such as `git rev-parse`, not filesystem assumptions.
- Repo-level config, hooks, remotes, object storage, and submodule definitions may be shared. Per-worker changes to repo configuration, hooks, remotes, or submodule policy require explicit authorization.

## Live State Anchor

Before creating, assigning, cleaning, merging, pruning, or repairing worktrees, capture:

```powershell
git -C <repo> worktree list --porcelain
git -C <repo> status -sb
git -C <repo> branch -vv
git -C <repo> rev-parse --show-toplevel
git -C <repo> log -1 --oneline --decorate
```

If remote freshness matters and mutation is not allowed:

```powershell
git -C <repo> ls-remote origin refs/heads/<branch>
```

The report must name the active filesystem path, branch, `HEAD`, dirty state, and any other worktree that already owns a relevant branch.

## When To Use A Worktree

Use a worktree when it materially reduces risk or context pressure:

- a worker lane needs isolated file edits or tests while the controller keeps its own tree stable;
- a hotfix, release check, review, or reproduction must happen while the current worktree is dirty;
- an experiment or spike should not disturb the main task's index, untracked files, or process state;
- an independent reviewer needs a clean build/test pass from a specific commit or branch;
- a handoff/new thread should start from a clean directory while preserving the old thread's dirty state.

Do not create a worktree when a single narrow task can finish safely in the current tree, when branch ownership is unclear, or when the lane depends on untracked artifacts that are not reproducible in a fresh directory.

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
```

After creation, verify from the new path:

```powershell
git -C <worktree_path> status -sb
git -C <worktree_path> rev-parse HEAD
git -C <worktree_path> worktree list --porcelain
```

If submodules are part of the project, initialize/update them from the new worktree before testing. If dependencies or generated assets are local-only, state that the worktree is not yet equivalent to the source tree.

## Branch And Force Rules

- Do not assign two writing workers to the same branch or same worktree.
- Do not use `git worktree add --force`, branch deletion, branch reset, `git branch -f`, `git branch -D`, or equivalent force actions to bypass another worktree without explicit user approval and a live-state report.
- When Git refuses a branch because it is checked out in another worktree, stop and decide: use a new branch, use a detached read-only worktree, hand off to the existing owner, or ask the user.
- Do not rebase, reset, amend, delete, or rename a branch that another active worktree owns unless the owner and user have opened that gate.
- Do not stash or clean another worktree's files from the controller tree. Run ownership checks in the target worktree path.

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
verification_commands:
report_required: status -sb, HEAD, changed files, test results, worktree list excerpt
cleanup_policy: keep / remove after merge / ask controller
push_policy: forbidden / allowed after approval / required
force_policy: forbidden unless explicitly reauthorized
```

Workers must run edits, tests, and Git status commands inside `assigned_worktree`, not whichever directory the shell happens to start in.

## Review And Integration

- Use detached or read-only worktrees for pure review, reproduction, bisection, or artifact inspection.
- Have the worker report exact changed files, branch, `HEAD`, verification output, and any untracked/ignored outputs that matter.
- Integrate in the controller or designated integration worktree after checking dirty state and branch freshness.
- Before merging a worker branch, verify that the worker's branch is not still dirty and that its result has passed the active QA/security/browser/release gates.

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

Run `prune --dry-run` before pruning. Prune only stale administrative entries, not useful files. If a worktree was moved manually, use `repair` rather than deleting metadata by guess.

## Handoff Requirements

Any Git-aware handoff or checkpoint must include worktree state when worktrees are present:

- current worktree path;
- `git worktree list --porcelain` summary;
- active branch and `HEAD` for each relevant worktree;
- dirty state per relevant worktree;
- branch ownership conflicts;
- which worktree the next thread should use;
- cleanup policy for temporary or worker worktrees.

Trust live Git state over the handoff packet if they disagree.
