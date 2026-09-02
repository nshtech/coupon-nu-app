# Release Commands Cheat Sheet

All commands run from `coupon-nu-app/frontend/`.

## Dev

```bash
npx expo start            # start Metro bundler
npx expo run:ios          # run in iOS simulator
npx expo run:android      # run in Android emulator
npm test                  # run Jest tests (watch mode)
```

## Bumping the app version (iOS)

This project has a native `ios/` directory, so version numbers do NOT come from
`app.json`. There are two separate things to bump:

1. **Marketing version** (`1.0`, `1.1`, ...) — must be higher than the last
   version Apple approved, or submission fails with error `90062`.
   - `eas.json` has `"appVersionSource": "remote"`, so EAS overwrites
     `CFBundleShortVersionString` from its own remote counter at build time —
     editing `app.json` or `ios/*.xcodeproj/project.pbxproj` directly does
     **nothing**, EAS clobbers it.
   - Set it through EAS instead (interactive prompt, needs a real terminal):
     ```bash
     npx eas-cli build:version:set --platform ios
     # What version would you like to set? -> e.g. 1.1.0
     ```

2. **Build number** (`18`, `19`, `20`, ...) — auto-incremented by
   `eas.json`'s `"autoIncrement": true` on the `production` profile. Usually
   no manual action needed.

## Build & submit (iOS)

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```

## Environment variables

Two separate places hold env vars — keep them in sync:

- **Local `.env`** — used by `expo start` / local dev only.
- **EAS remote environment** — actually used by `eas-cli build`. Local
  `.env` edits do NOT affect production builds.

```bash
npx eas-cli env:list production                                          # view
npx eas-cli env:set production --name KEY --value VAL --visibility plaintext --non-interactive   # set
npx eas-cli env:delete production --variable-name KEY --non-interactive  # delete
```

## Common submission errors

- **`90186: Invalid Pre-Release Train`** / **`90062: CFBundleShortVersionString
  must contain a higher version`** — marketing version wasn't actually bumped.
  See "Bumping the app version" above; remember `appVersionSource: remote`
  means the usual `app.json` edit is a no-op.
- **`Nonexistent flag: --skip-app-create`** — flag removed in current
  `eas-cli`. Just run `eas-cli submit --platform ios --latest`.
