# TimePast

TimePast is a local-first Windows desktop productivity app for time entries, smart sticky notes, basic reminders, and Pomodoro sessions.

## Install

Download the latest Windows installer from the GitHub Releases page and run:

- `TimePast_0.1.0_x64-setup.exe` for the standard installer
- `TimePast_0.1.0_x64_en-US.msi` for MSI deployment

All app data is stored locally on the user's machine.

## Development

```bash
npm install
npm run dev
npm run tauri dev
```

## Build

```bash
npm run build
npm run tauri build
```

## Release

Versioned releases are created from Git tags:

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin main
git push origin v0.1.0
```

The GitHub Actions release workflow builds the Windows installers and attaches them to the GitHub Release.