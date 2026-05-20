# zaturi

Expo + React Native + TypeScript app scaffolded for Android and iOS development across multiple desktops.

## Requirements

- Node.js 20.20.1 recommended. Expo SDK 54 requires Node 20.19.x or newer.
- npm 10 or newer.
- Android Studio for Android emulator/device builds.
- macOS with Xcode for local iOS simulator/native builds. Windows can still create iOS cloud builds through EAS.

## Product Direction

This app is being built as `자투리여행`, a route-based tourism curation service that turns spare time during Gangwon car travel into short, realistic stopover experiences.

- [Project brief](docs/PROJECT_BRIEF.md)
- [Product flow](docs/PRODUCT_FLOW.md)
- [Current direction](docs/CURRENT_DIRECTION.md)
- [Development structure](docs/DEVELOPMENT_STRUCTURE.md)
- [Codex workflow](docs/CODEX_WORKFLOW.md)
- [Development tooling](docs/DEVELOPMENT_TOOLING.md)
- [Kakao API proxy](docs/KAKAO_PROXY.md)
- [TourAPI integration](docs/TOUR_API_INTEGRATION.md)
- [Recommendation policy](docs/RECOMMENDATION_POLICY.md)
- [APK test build](docs/APK_TEST_BUILD.md)

## Project Workflow

For meaningful code, config, or product-direction changes, create a handoff log:

```powershell
npm run log:new -- "short work title"
```

Then fill in the generated file under `work_logs/`.

Useful local quality/tooling checks:

```powershell
npm run typecheck
npm run check:react
npm run maestro:version
```

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
- `npm run proxy:kakao` starts the local Kakao API proxy.
- `npm run check:deps` checks Expo SDK-compatible dependency versions.

## Kakao API proxy

Real Kakao Local and Kakao Mobility calls require a Kakao REST API key. Keep it server-side:

```powershell
copy .env.example .env
# Fill KAKAO_REST_API_KEY in .env or .env.proxy.local
npm run proxy:kakao
```

The Expo app reads `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL` and falls back to mock route math when the proxy or key is unavailable.

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
