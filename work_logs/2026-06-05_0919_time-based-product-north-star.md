# 2026-06-05 09:19 KST - time based product north star

## Request

- Lock in the confirmed final product goal from the user conversation.
- Reframe the app from only a route stopover recommender into a time-based travel recommendation service.

## Context Docs Consulted

- `docs/CURRENT_DIRECTION.md`
- `docs/PRODUCT_FLOW.md`
- `docs/DEVELOPMENT_STRUCTURE.md`

## Summary

- Updated the product north star to: `자투리여행은 목적지 중심 여행 앱이 아니라, 이동 중이든 도착 후든 남는 시간을 쓸 만한 경험으로 바꿔주는 시간 기반 여행 추천 앱.`
- Defined three core product modes: moving stopover, nearby spare-time, and my zaturi spots.
- Added a dedicated product direction document for time-based recommendation decisions.
- Updated the target development structure with future nearby recommendation and user-added spot modules/screens.

## Changed Files

- `docs/CURRENT_DIRECTION.md`
- `docs/TIME_BASED_PRODUCT_DIRECTION.md`
- `docs/DEVELOPMENT_STRUCTURE.md`
- `work_logs/2026-06-05_0919_time-based-product-north-star.md`

## Verification

- Documentation-only change; no code/typecheck required.
- Checked project status after edits.

## Decisions

- Moving stopover remains a main mode, not a discarded flow.
- Nearby spare-time becomes the second main mode.
- User-added zaturi spots should become recommendation candidates, not just bookmarks.

## Follow-Ups

- Split the home screen into `이동 중 경유` and `지금 근처에서` modes.
- Add a nearby recommendation result shape and card.
- Add a local-only custom zaturi spot creation flow.
