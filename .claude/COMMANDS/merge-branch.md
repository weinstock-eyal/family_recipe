Follow these steps in order:

1. **Detect target branch** — Run `git remote show origin` or check the repo's default branch (e.g. `master` or `main`). This is the branch you will merge into. No need to ask the user.

2. **New branch name** — If a branch name was provided as `$1`, use it directly. Otherwise, ask the user: "מה שם הענף החדש שתרצה ליצור?" and wait for a response.

3. **Commit** — Stage and commit all changes on the current branch. Analyze the diffs to generate a clear, concise commit message that describes what changed and why.

4. **Merge** — Merge the current branch into the target branch detected in step 1. If merge conflicts arise, resolve them while preserving the intent of both sides, then commit the resolution.

5. **New branch** — Create and check out a new branch with the name the user provided in step 2, based off the target branch.
