# AGENTS.md

## Task Board Workflow

These rules apply to tasks from the money-keeper board at https://tasks.ya-erm.ru/b/money-keeper/tasks/.

- Implement each task in its own Git branch and create a pull request in the GitHub repository.
- For UI changes, verify the affected interface at a mobile viewport width of **390 px** and capture screenshots of the actual result.
- Post the result and verification steps in a comment on the task. Include the GitHub pull request link and the Vercel preview link when available.
- For UI changes, upload the mobile screenshots and embed them in the task comment as Markdown images so they can be reviewed directly on the board.
- If the Vercel preview or a required check is unavailable, state the limitation in the task comment.

## Development Server

- If a dev server is already running, use the existing server URL for verification. Do not try to start another dev server unless the existing one is unreachable and you have confirmed the expected URL or port.

## Releases and Changelog

- When adding new functionality or making significant fixes, bump the application version in `package.json`.
- In the same change, update both changelog files:
  - `CHANGELOG.md` for English release notes.
  - `CHANGELOG.ru.md` for Russian release notes.
