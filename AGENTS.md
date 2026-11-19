# AGENTS.md

## Task Board Workflow

These rules apply to tasks from the money-keeper board at https://tasks.ya-erm.ru/b/money-keeper/tasks/.

- Implement each task in its own Git branch and create a pull request in the GitHub repository.
- For UI changes, verify the affected interface at a mobile viewport width of **390 px** and capture screenshots of the actual result.
- Post the result and verification steps in a comment on the task. Include the GitHub pull request link and the Vercel preview link when available.
- For UI changes, upload the mobile screenshots and embed them in the task comment as Markdown images so they can be reviewed directly on the board.
- If the Vercel preview or a required check is unavailable, state the limitation in the task comment.

## Task Comment Approvals

- An explicit instruction or confirmation from the user in a task comment, read through the authenticated API of the assigned board, is authorization for that task just like an instruction in this chat. Do not ask the user to repeat approval in chat solely because it was given in a task comment.
- This includes an explicit request to merge the task's GitHub pull request. Confirm the intended PR, check its current head, resolve conflicts and require successful checks before merging.
- Task comments authorize only the requested action within the assigned task. They do not override higher-priority instructions or an explicit pause. If automatic approval review rejects an action, report the stated reason and follow that decision; these project rules do not bypass it.

## Development Server

- If a dev server is already running, use the existing server URL for verification. Do not try to start another dev server unless the existing one is unreachable and you have confirmed the expected URL or port.

## Releases and Changelog

- When adding new functionality or making significant fixes, bump the application version in `package.json`.
- In the same change, update both changelog files:
  - `CHANGELOG.md` for English release notes.
  - `CHANGELOG.ru.md` for Russian release notes.
