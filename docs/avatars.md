# Participant photos

Participant photos use the private Yandex Object Storage bucket `money-keeper` with a maximum size of 10 GiB (10,737,418,240 bytes). Public reads, listings, and writes are disabled.

## Server configuration

Configure these server-only environment variables on the app deployment:

- `YC_AVATAR_SERVICE_ACCOUNT_KEY`: JSON authorized key with `id`, `service_account_id`, and `private_key`.
- `YC_AVATAR_BUCKET`: optional bucket name, defaults to `money-keeper`.

Use the dedicated `money-keeper-avatars` service account with `storage.uploader` on this bucket only. The infrastructure account's key is not needed by the app. Store credentials as secrets, outside source control. The server exchanges signed JWTs for short-lived IAM tokens and reuses them for at most one hour.

The browser crops the selected image to a centered 512 × 512 square and sends a lossless PNG only when the participant form is saved. Original images stay on the device. The API validates and re-encodes the result as a static WebP at quality 95, stripping original metadata before sending it to storage. Device-supported image files up to 20 MiB can be selected; the API bounds incoming bodies at 2 MiB and decoded images at 16 million pixels.

Uploads require authentication, the same Origin, and a workspace header matching the session. The API generates random object IDs. Objects are stored under `avatars/<authenticated member UUID>/<object UUID>.webp`. Downloads use the app's authenticated API, which derives the workspace from the session rather than accepting an owner path. The bucket credential is never sent to the browser. An unavailable image falls back to the participant's icon or initials.

The participant journal and JSON exports contain `avatarId` references, not image bytes. Restore photos in the same account; importing into a different account does not grant access to the original account's files. Replacing a photo retains the old object so existing journal history and backups continue to work. Leaving the editor without saving does not upload the pending photo.

## Verification

Unit tests for conversion and authentication are in `src/lib/server/avatars/`. Normal mobile tests cover the icon/color UI. `tests/wallets/participantPhotos.live.test.ts` is an opt-in integration test: it requires `AVATAR_LIVE_TESTS=1`, the local server at port 4173, a separate PostgreSQL `avatar_test` database at port 55434, and a runtime storage key. It creates temporary accounts only in that isolated database and records the generated cloud object ID in the test output for cleanup. Never point this test at the production database.
