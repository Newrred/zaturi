# Time-Based Product Direction

Last updated: 2026-06-05

## Final Goal

`자투리여행은 목적지 중심 여행 앱이 아니라, 이동 중이든 도착 후든 남는 시간을 쓸 만한 경험으로 바꿔주는 시간 기반 여행 추천 앱.`

This sentence is the product anchor. Future features should be judged by whether they help the user convert spare time into a realistic, worthwhile experience.

## Why This Matters

Most travel apps start from a destination, attraction, restaurant, or map search. Zaturi should start from a user's situation:

- I am driving somewhere and can spare 30-120 minutes.
- I arrived early and have 30 minutes nearby.
- I finished something and suddenly have time left.
- I know a small place worth saving even if it is not an official attraction.

The product should answer: "What can I realistically do with this spare time from here?"

## Primary Modes

### 1. Moving Stopover

The current MVP flow belongs here.

Input:

- Origin
- Destination
- Spare time
- Companion/weather/accessibility preferences

Output:

- Comparable route bundles
- Baseline route vs waypoint route
- Added driving minutes
- Stay time and reason
- External navigation action

Core card proof:

```text
Basic route: 168 min
Via spot: 177 min
Added drive: +9 min
Stay: 50 min
Fits 120 min spare time
```

### 2. Nearby Spare-Time

This is the newly confirmed second main mode.

Input:

- Current GPS or selected base location
- Spare time
- Travel mode: walking or car
- Companion/weather/accessibility preferences

Output:

- Nearby options that fit within the time budget
- Travel time + stay time + optional return buffer
- Clear reason why it fits now
- Map preview and optional navigation action

Core card proof:

```text
Move: 6 min
Stay: 20 min
Buffer: 4 min
Fits 30 min spare time
```

### 3. My Zaturi Spots

The app should let users manually save small places that official APIs may miss.

MVP fields:

- Name
- Location
- Memo
- Estimated stay time
- Tags such as view, walk, quiet, photo, cafe, restroom, local
- Private/public flag later; MVP can stay local-only

Recommendation role:

- Personal spots can appear in moving stopover results.
- Personal spots can appear in nearby spare-time results.
- Later, shared/community spots can support locals, repeat travelers, and foreign visitors.

## Recommendation Sources

Use multiple candidate sources but normalize them into app-owned models:

- TourAPI public tourism data
- Kakao route/time calculations through the server proxy
- User-saved local spots
- Future VWorld/address data for broader coordinate search
- Future curated/community spots

The UI should not expose raw source complexity. Users should see why something fits their time.

## Near MVP Screen Shape

Home should become a mode selector:

```text
[이동 중 경유] [지금 근처에서]
```

Moving stopover:

- Origin search
- Destination search
- Spare time
- Conditions
- Route-bundle recommendations

Nearby spare-time:

- Current location or place search
- Spare time
- Walking/car preference
- Conditions
- Nearby time-fit recommendations

Saved/custom spots:

- Saved list
- Add spot
- Edit memo/tags/stay time

## Success Criteria

- A tester can understand the two use cases without explanation.
- Recommendation cards make the time math obvious.
- The app feels useful even after the user has already arrived somewhere.
- Manually saved spots are treated as first-class recommendation candidates, not just bookmarks.
- Public API data remains credible, but the service identity is defined by spare-time fit.
