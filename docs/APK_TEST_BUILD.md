# APK Test Build

Last updated: 2026-05-20

## Goal

Create an Android APK that can be sent to testers without requiring them to run Expo, Metro, or the local proxy on their own machine.

## Important Constraint

An APK installed on another phone cannot call `http://localhost:3000` on this development desktop.

For real Kakao/TourAPI data, deploy `server/kakao-proxy.mjs` to a public HTTPS server first, then build the APK with:

```text
EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL=https://your-public-proxy.example.com
```

Keep these keys only on the server:

```text
KAKAO_REST_API_KEY=
TOUR_API_SERVICE_KEY=
```

Do not put Kakao or TourAPI keys in any `EXPO_PUBLIC_` variable.

## Recommended Flow

1. Deploy the proxy server.
2. Confirm the deployed proxy health endpoint works:

```powershell
Invoke-RestMethod -Uri "https://your-public-proxy.example.com/health"
```

3. Add the public API URL to the EAS `preview` environment:

```powershell
npx eas-cli@latest env:create --environment preview --visibility plaintext --name EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL --value "https://your-public-proxy.example.com"
```

4. Build the production-like tester APK without dev tools:

```powershell
npm run build:android:preview
```

5. Send the EAS install URL or downloaded `.apk` file to testers.

## Current Build Profile

`eas.json` has a `preview` profile configured for Android APK output:

```json
{
  "distribution": "internal",
  "environment": "preview",
  "android": {
    "buildType": "apk"
  }
}
```

Expo's EAS internal distribution is intended for test installs. Android internal distribution builds generate directly installable APK files.

## Creating A Public Proxy On Render

Render is the simplest current path for this project because the repo now includes `render.yaml`.

1. Push this repository to GitHub.
2. Open Render and create a new Blueprint or Web Service from the GitHub repo.
3. If Render detects `render.yaml`, use it. It defines:

```text
buildCommand: npm ci
startCommand: npm run start:proxy
healthCheckPath: /health
```

4. Fill the secret values Render asks for:

```text
KAKAO_REST_API_KEY
TOUR_API_SERVICE_KEY
```

5. Deploy the service.
6. Copy the generated HTTPS URL, usually like:

```text
https://zaturi-api.onrender.com
```

7. Test:

```powershell
Invoke-RestMethod -Uri "https://zaturi-api.onrender.com/health"
```

The response should include:

```json
{
  "ok": true,
  "hasKakaoRestApiKey": true,
  "hasTourApiServiceKey": true
}
```

Use that HTTPS URL as `EXPO_PUBLIC_ZATURI_ROUTE_PROXY_URL` for the EAS `preview` build.

## Quick Local Sanity Checks Before Building

```powershell
npm run typecheck
npx react-doctor@latest --verbose --diff
```

Then test the same proxy URL that will be baked into the APK.

## If You Build Before Deploying The Proxy

The APK can still run, but live Kakao/TourAPI data will not work for another tester unless their device can reach the configured proxy URL. With the current local URL, another phone will usually fall back to mock route behavior.
