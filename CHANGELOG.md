# Changelog

## 2.12.0 - 2026-06-17

### Added

- Added a monthly income vs expenses analytics screen.
- Added privacy mode to hide amounts across accounts, analytics, and settings.
- Added a "What's new" page in app settings and changelog.

### Changed

- Redesigned the Analytics page.

## 2.11.0 - 2026-06-10

### Added

- Added account balance correction.
- Added automatic category selection when an operation has the same name as a previous operation.
- Added session token refresh to keep logged-in sessions active.

### Changed

- Show last used currencies in the another-currency modal.
- Hide raw export textbox content until the user explicitly opens it.

### Fixed

- Fixed precision error in the account balance correction modal.
- Fixed modal behavior through the UI library update.

## 2.10.3 - 2026-02-28

### Changed

- Updated Svelte, SvelteKit, Vite, ESLint, and related libraries.
- Fixed lint issues caused by dependency upgrades.

## 2.10.2 - 2025-03-07

### Added

- Operations repeating work in progress.

### Development

- Migrated from `npm` to `pnpm`.
- Updated dependencies.

## 2.9.4 - 2024-10-27

### Added

- Comment suggestions based on previous operations.
- Long press on operation to open additional options: duplicate and delete.

### Changed

- Updated dependencies.
- Fixed some issues.

## 2.9.2 - 2024-09-02

### Added

- Balance history chart on analytics page.
- Suggestions and recommended icons for new categories.
- Availability to exclude operation from analytics.
- Categories reordering.

### Changed

- Show 2 lines of categories.
- Balance history chart legend.
- Done button in transaction page.
- Fixed some bugs and issues.

## 2.8.6 - 2024-06-02

### Added

- Archived accounts.
- Group and search for currency rates.

### Changed

- Pagination for operations as a performance improvement.
- Option to hide zero-balance accounts from accounts list.
- Fixed some bugs and issues.

## 2.8.5 - 2024-05-07

### Changed

- Restore scroll position after operation editing.
- Autofill destination amount value for same-currency transfers.
- Performance optimizations for data stores.
- Fixed theme switch in settings.
- Fixed input focus in operation form.

## 2.8.4 - 2024-02-29

### Added

- Option to hide zero-balance accounts in analytics page.
- Groupings to export and import.

### Changed

- Updated dependencies.
- Removed v1 API, routes, and entities in DB schema.
- Fixed import algorithm.
- Fixed header button second click.
- Fixed account analytics table styles.
- Fixed analytics page SSR.
- Fixed input mode for number inputs.

## 2.8.3 - 2024-01-25

### Added

- Guest mode. It is designed only to try out the app; guest data is not synchronized with the server and may be lost if browser storage is cleared.
- Custom interval select to analytics page.

### Changed

- Small fixes of operations sort.
- Fixed problem of adding operation when account is not selected.

## 2.7.0 - 2023-11-20

### Added

- Time zone for each operation.
- Time zone list, favorite time zones, and current time zone.

### Changed

- Small fixes of future operations and zero money display.
- Remember last another currency.

## 2.6.2 - 2023-11-18

### Added

- Another currency option for operations.
- Calc expressions in operation comments.

### Changed

- Show error toast when failed to fetch updates.

## 2.5.2 - 2023-10-16

### Added

- Accounts analytics page showing money distribution by accounts.
- Custom groupings in accounts analytics.
- Operations preview on monthly analytics page.

### Changed

- Search by tags.
- Add day of week to operations list.
- Future operations hidden by spoiler.
- Add button "Save as json" to export page.
- Sticky save button in account list sorting.

## 2.2.0 - 2023-08-11

### Changed

- Updated account selector.
- Added accounts list sorting by drag and drop.

## 2.0.0 - 2023-06-09

### Added

- Offline mode with local DB and sync with server.
- Main analytics page.
- Import and export.
- Started client-side RSA-based encryption.
- Started other analytics pages.

### Changed

- Redesigned the data storage system to support offline mode.
- Server-side data storage became a log of entity changes.

## 1.0.0 - 2023-04-11

### Added

- Rules of import.
- Account order number for temporary sorting.
- Manual currency rates and main currency.

### Fixed

- Modals width bug.

## 0.1.1 - 2023-04-11

### Added

- Project description in README.

### Fixed

- Date time shift.
- Modals UI bug.
- Status bar color in PWA.

## 0.1.0 - 2023-01-30

### Added

- First minimum viable product version.
- Categories and accounts.
- Operations: incomings, outgoings, and transfers.
- Collaboration with shared access to other users.
- Translation for English and Russian.
- Iconify icons support.
