# Development Tooling

Last updated: 2026-06-04

This document records installed or researched development tools that can improve the Codex-assisted workflow for this Expo + React Native app.

## Installed In This Environment

### Context7 MCP

Purpose: lets Codex fetch up-to-date, version-specific library documentation during development.

Installed as a global Codex MCP server:

```powershell
codex mcp add context7 -- npx -y @upstash/context7-mcp@latest
```

Status:

- Registered in `codex mcp list` as `context7`.
- API key is not configured. Context7 says an API key is recommended for higher rate limits, but local MCP can be registered without one.
- Restarting or opening a new Codex session may be required before the MCP tools are available inside the active tool list.

License: MIT.

Sources:

- https://github.com/upstash/context7
- https://context7.com/docs/installation

### Maestro

Purpose: mobile E2E testing for Android, iOS, and web through human-readable YAML flows.

Installed on this Windows desktop:

```text
C:\Users\hongs\.maestro\cli-2.5.1\maestro
```

User PATH includes:

```text
C:\Users\hongs\.maestro\cli-2.5.1\maestro\bin
```

Java note:

- Maestro requires Java 17 or higher.
- This desktop has Android Studio JBR Java 21 at `C:\Program Files\Android\Android Studio\jbr`.
- New terminals should inherit `JAVA_HOME` from the user environment.

Project scripts:

```powershell
npm run maestro:version
npm run test:e2e
```

First flow:

```text
maestro/flows/smoke.yaml
```

License: Apache-2.0.

Sources:

- https://github.com/mobile-dev-inc/maestro
- https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli

### React Doctor

Purpose: React/React Native codebase diagnostics for security, correctness, performance, accessibility, and architecture.

Installed as a project dev dependency:

```powershell
npm install --save-dev react-doctor@0.2.1
```

Also installed as a Codex skill at:

```text
C:\Users\hongs\.codex\skills\react-doctor\SKILL.md
```

Project scripts:

```powershell
npm run check:react
npm run check:react:strict
```

Important caveat:

- `react-doctor@0.2.1` declares `node >=22`.
- This project currently recommends Node 20.20.1 for Expo SDK 54.
- The CLI was tested successfully under Node 20.20.1 in offline mode, but keep it advisory unless the project later moves to Node 22.

License: MIT.

Source:

- https://github.com/millionco/react-doctor

### Route Preview Libraries

Purpose: supports the current free MVP map and route comparison layer.

Installed project dependencies:

- `react-native-svg`: draws the recommendation-card route comparison without map tiles.
- `react-native-webview`: renders the OpenStreetMap single-pin embed on native builds.
- `expo-build-properties`: adds the Kakao Maps Maven repository during Android prebuild/EAS native builds.

Notes:

- Both were installed with `npx expo install` for Expo SDK 54 compatibility.
- OpenStreetMap embed/tile usage is suitable for prototype validation, but production traffic should be reviewed against provider policy or moved to VWorld/Kakao/commercial/self-hosted tiles.

### Kakao Maps Native SDK

Purpose: renders a native Kakao map in Android spot detail screens.

Current implementation:

- Local Expo native module: `modules/zaturi-kakao-map`.
- Android SDK dependency: `com.kakao.maps.open:android:2.13.2`.
- Maven repository: `https://devrepo.kakao.com/nexus/repository/kakaomap-releases/`.
- App-side key variable: `EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY`.
- Android component: `src/components/SpotMap.android.tsx`.

Notes:

- This cannot be tested in Expo Go because it contains custom native code. Use an Expo dev build or EAS preview APK.
- The key must be Kakao's Native App Key, not the REST API key used by `server/kakao-proxy.mjs`.
- Kakao Developers must include the Android package name `com.zaturi.app` and the matching debug/release key hash.
- iOS is intentionally left on the existing OSM fallback until a Swift bridge is added for the Kakao iOS SDK.

## Useful Permissive OSS Candidates

These are not installed yet. Add them only when the app reaches the related implementation step.

| Package | License | Use In This App | Recommendation |
| --- | --- | --- | --- |
| `expo-router` | MIT | File-based routing for home, recommendations, spot detail, saved, settings | Adopt soon |
| `expo-location` | MIT | Current location permission and coordinates | Adopt when location flow starts |
| `expo-linking` | MIT | Open external navigation apps and deep links | Adopt with navigation handoff |
| `@tanstack/react-query` | MIT | Server/cache state for TourAPI or backend calls | Adopt before real API integration |
| `zod` | MIT | Validate public API responses before mapping to app models | Adopt before TourAPI integration |
| `zustand` | MIT | Lightweight local app preferences and filter state | Good fit for MVP |
| `react-hook-form` | MIT | Destination/time/filter forms | Good fit once input screens grow |
| `@react-native-async-storage/async-storage` | MIT | Saved spots and simple persisted preferences | Good fit for MVP |
| `@turf/turf` | MIT | Geospatial calculations like distance, bbox, route proximity | Strong fit for recommendation logic |
| `geolib` | MIT | Simpler distance calculations than Turf | Use if Turf feels too heavy |
| `@shopify/flash-list` | MIT | Fast recommendation/result lists | Use when lists become large |
| `@gorhom/bottom-sheet` | MIT | Map/detail bottom sheet UI pattern | Use when map/result UI starts |
| `react-native-maps` | MIT | Native map display | Useful, but map provider terms/API keys still matter |
| `react-native-svg` | MIT | Route mini-map drawing without tile APIs | Installed for route comparison cards |
| `react-native-webview` | MIT | Native OSM/VWorld/Leaflet-style embedded map preview | Installed for free spot pin preview |
| `expo-sqlite` | MIT | Local cached tourism data or offline prototype storage | Consider after data volume grows |
| `expo-secure-store` | MIT | Sensitive tokens if login/API proxy auth appears | Use only if needed |
| `date-fns` | MIT | Time windows, operating hours, simple date formatting | Good utility candidate |

License note: package license fields were checked through npm metadata. Provider terms still apply separately for map tiles, geocoding, routing, public data APIs, and weather APIs.

## Suggested Adoption Order

1. `expo-router` for app structure.
2. `zod` and app-owned domain types before real API mapping.
3. `zustand` or React state for MVP filters.
4. `@tanstack/react-query` once API calls begin.
5. `expo-location` and `expo-linking` when location/navigation handoff starts.
6. `@turf/turf` or `geolib` when route proximity logic begins.
7. `react-native-maps`, bottom sheets, and list optimization after the core recommendation flow is visible.
