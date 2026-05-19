# zaturi

Expo + React Native + TypeScript app scaffolded for Android and iOS development across multiple desktops.

## Requirements

- Node.js 20.20.1 recommended. Expo SDK 54 requires Node 20.19.x or newer.
- npm 10 or newer.
- Android Studio for Android emulator/device builds.
- macOS with Xcode for local iOS simulator/native builds. Windows can still create iOS cloud builds through EAS.

## Windows Android setup

On this desktop, the user environment variables were set for Android CLI work. Reopen PowerShell or VS Code terminals after setup so new shells inherit them.

- `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`
- `ANDROID_SDK_ROOT=%LOCALAPPDATA%\Android\Sdk`
- `JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`
- User `Path` includes Android `platform-tools`, Android `emulator`, and Android Studio `bin`.

For another Windows desktop, install Android Studio, open SDK Manager once, install an Android SDK/platform-tools/emulator package, then mirror the variables above.

## First setup on any desktop

```powershell
git clone <repo-url> zaturi
cd zaturi
npm ci
copy .env.example .env
npm run typecheck
```

## Local development

```powershell
npm start
```

Useful commands:

- `npm run android` starts Expo and opens Android.
- `npm run ios` starts Expo and opens iOS. This requires macOS/Xcode for the simulator.
- `npm run start:dev-client` starts Metro for an installed Expo development build.
- `npm run web` starts the web target.
- `npm run check:deps` checks Expo SDK-compatible dependency versions.

## EAS development builds

EAS CLI is intentionally not installed as a project dependency. Use the scripts below, or install it globally with `npm install --global eas-cli`.

```powershell
npm run eas:login
npm run eas:whoami
npm run build:android:dev
npm run build:ios:dev
```

The app identifiers are currently set to `com.zaturi.app` in `app.json`. Change them before the first store release if you need a different publisher namespace.

## What should move between desktops

Commit source files, `package-lock.json`, `app.json`, `eas.json`, `.nvmrc`, `.node-version`, and `.env.example`.

Do not commit `node_modules`, `.env`, Expo local state, Android/iOS generated folders, keystores, certificates, provisioning profiles, or other signing credentials.
