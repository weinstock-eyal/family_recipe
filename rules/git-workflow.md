# Git Workflow

When working on multi-step or multi-feature tasks, follow these rules autonomously — like a senior developer managing their own branches.

## Branching
- **One feature = one branch.** Each distinct feature, page, or component gets its own branch.
- **Branch naming:** kebab-case, descriptive (e.g., `recipe-detail-page`, `grocery-list-feature`).
- **Create the branch before writing the first line of code** for that feature.

## Commits
- **Atomic commits.** Commit after each logical unit of work (a component, a data layer function, a page layout). Never bundle unrelated changes in one commit.
- **Meaningful messages.** Analyze the diff and write a concise message that describes *what* changed and *why*.

## Feature transitions
When one feature is complete and the next begins, autonomously and without asking:
1. Commit all remaining changes on the current branch.
2. Merge the current branch into the main branch (auto-detect via git).
3. Create a new branch for the next feature with a descriptive name.

Use the `/merge-branch` command for this flow, but **choose the new branch name autonomously** — no need to ask the user.

## Autonomy
- **Do not ask permission** for routine git operations (commits, branch creation, merges to main). These are expected workflow.
- **Do ask** if something unexpected happens (merge conflict that changes logic, uncertainty about feature boundaries).
