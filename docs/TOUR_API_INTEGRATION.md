# TourAPI Integration

Last updated: 2026-05-20

## Current Role

TourAPI should provide the candidate tourism spots.

Kakao Mobility should evaluate whether those spots are realistic route stopovers.

```text
Kakao baseline route
-> TourAPI location-based candidate spots around the route
-> local route-corridor filtering
-> Kakao waypoint route evaluation
-> recommendation bundles
```

## Environment

The TourAPI key is server-only.

```text
TOUR_API_SERVICE_KEY=your_data_go_kr_service_key
```

Do not expose this with `EXPO_PUBLIC_`.

## Server Behavior

The local proxy in `server/kakao-proxy.mjs` now:

1. Reads `TOUR_API_SERVICE_KEY`.
2. Calls `KorService2/locationBasedList2` around sampled points from the Kakao route polyline.
3. Maps and filters TourAPI items through `server/recommendation/tour-candidate-policy.mjs`.
4. Returns app-owned `TravelSpot` candidates with policy metadata such as content type, priority, and reasons.
5. Falls back to the existing mock spots if TourAPI is unavailable or returns no usable candidates.

Tuning variables:

```text
TOUR_API_ROUTE_SAMPLE_LIMIT=6
TOUR_API_CANDIDATE_LIMIT=40
TOUR_API_SEARCH_RADIUS_METERS=12000
```

## Current Data Quality

Currently mapped from TourAPI:

- content id
- title
- content type id
- address
- coordinate
- representative image when available

Currently estimated by the app:

- stay minutes
- walking minutes
- parking availability
- barrier-free availability
- weather fit
- family friendliness

These estimates should later be replaced or improved using TourAPI detail endpoints, barrier-free APIs, or service-specific curation rules.

## Current Key Status

On 2026-05-20, the local `.env` contained a working `TOUR_API_SERVICE_KEY`.

The proxy successfully calls `KorService2/locationBasedList2` and the recommendation screen can now show TourAPI candidate spots with live Kakao route timing.

A previous failure was caused by proxy URL construction dropping `/B551011/KorService2` from the upstream URL. The proxy now strips leading slashes before composing TourAPI endpoint URLs.

Candidate filtering is now separated into `server/recommendation/tour-candidate-policy.mjs`. The current MVP policy prioritizes tourism spots, cultural facilities, travel courses, scenic/walk keywords, and local experience keywords. Lodging is excluded by default, while generic food, camping, and shopping are treated as support candidates with lower priority.

See [Recommendation Policy](RECOMMENDATION_POLICY.md) before changing candidate selection behavior.

## Official Reference

- Data.go.kr TourAPI GW: https://www.data.go.kr/data/15101578/openapi.do
