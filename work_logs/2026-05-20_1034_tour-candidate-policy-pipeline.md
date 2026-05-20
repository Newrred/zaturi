# 2026-05-20 10:34 KST - tour candidate policy pipeline

## Request

- Make TourAPI candidate filtering easier to revise as the recommendation logic goes through repeated tuning.
- Keep the structure friendly for adding/removing filters such as tourism, culture, walking/scenic, food, lodging, and camping rules.

## Context Docs Consulted

- `docs/PRODUCT_FLOW.md`
- `docs/CURRENT_DIRECTION.md`
- `docs/TOUR_API_INTEGRATION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`

## Summary

- Added a server-side TourAPI candidate policy module so API fetching, raw mapping, filtering, priority scoring, and route-corridor ranking are not all mixed together.
- Prioritized tourism spots, cultural facilities, travel courses, scenic/walk keywords, and local-experience keywords.
- Excluded lodging by default and lowered generic food/camping/shopping candidates so they can still be used later as support candidates without dominating the first MVP result set.
- Exposed policy reasons through `candidateMeta` and recommendation card reasons so the app can explain why a candidate appeared.

## Changed Files

- `server/recommendation/tour-candidate-policy.mjs`
- `server/kakao-proxy.mjs`
- `src/domain/recommendation/types.ts`
- `src/domain/recommendation/recommend.ts`
- `docs/RECOMMENDATION_POLICY.md`
- `docs/TOUR_API_INTEGRATION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `docs/CURRENT_DIRECTION.md`
- `README.md`
- `work_logs/2026-05-20_1034_tour-candidate-policy-pipeline.md`

## Verification

- `node --check server/kakao-proxy.mjs`
- `node --check server\recommendation\tour-candidate-policy.mjs`
- `npm run typecheck`
- `npx react-doctor@latest --verbose --diff`
- Restarted the local proxy and verified `POST /api/routes/candidates` returns TourAPI candidates and live Kakao waypoint assessments.
- Checked the Expo web recommendation screen on `http://localhost:8081/recommendations`; cards showed real TourAPI candidates with Kakao API timing.

## Decisions

- Keep the first filter stage server-side because TourAPI and Kakao keys must stay out of the Expo client.
- Keep policy rules as small plain objects for now: content type profiles, positive keyword boosts, penalties/exclusions, and route-corridor ranking.
- Keep Gangwon-only filtering for the initial MVP, because the competition/product direction is currently Gangwon-focused.
- Do not remove food/shopping categories entirely yet; lower their priority so they can become support stops when needed.

## Follow-Ups

- Add TourAPI detail endpoint enrichment after the first-pass policy has selected candidates.
- Add operating-hour, parking, accessibility, image-quality, and event-date checks before final scoring.
- Consider a small debug endpoint or admin view that shows candidate priority/reasons for tuning sessions.
- Add focused tests for the policy module once the first few tuning rules stabilize.
