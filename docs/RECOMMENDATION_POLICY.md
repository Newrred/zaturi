# Recommendation Policy

Last updated: 2026-05-20

## Purpose

Recommendation quality will need many rounds of tuning. Keep the candidate rules separate from API plumbing so filters and weights can be changed without rewriting the proxy.

The current policy module is:

```text
server/recommendation/tour-candidate-policy.mjs
```

## Pipeline

```text
TourAPI raw item
-> content type profile
-> keyword boost/penalty rules
-> exclusion rules
-> candidate priority
-> route-corridor ranking
-> Kakao waypoint timing
-> final app recommendation score
```

## Rule Groups

Content type profiles:

- `12` 관광지: high priority
- `14` 문화시설: high priority
- `15` 행사/축제: medium priority, requires date/context later
- `25` 여행코스: high priority
- `28` 레포츠: medium priority
- `32` 숙박: excluded by default
- `38` 쇼핑: low/support priority
- `39` 음식점: low/support priority

Keyword boosts:

- 전망/산책: 전망대, 공원, 해변, 숲, 수목원, 휴양림, 산책, 둘레길, 생태, 호수, 계곡
- 문화: 박물관, 미술관, 전시, 기념관, 문화, 역사, 유적, 사찰
- 지역체험: 시장, 거리, 골목, 마을, 항구, 등대
- 가벼운 휴식: 카페, 커피, 찻집, 정원

Penalties/exclusions:

- 숙박: 호텔, 모텔, 펜션, 리조트, 민박, 게스트하우스
- long-stay camping: 캠핑장, 글램핑, 야영장, 카라반
- generic food: 식당, 숯불, 갈비, 횟집, 막국수, 닭갈비, 감자옹심이, 한우

## How To Tune

To add a rule, edit `tour-candidate-policy.mjs`:

- Add a `contentTypeProfiles` entry for a new TourAPI content type.
- Add a `titleBoostRules` item for positive title/address keywords.
- Add a `penaltyRules` item for weak or inappropriate candidates.

Keep rules explainable. Every meaningful boost/penalty should add a short `reason` or tag so the app can later explain why a candidate appeared.

Common tuning moves:

- Too many restaurants: lower content type `39` or add more food keywords to `generic-food`.
- Too many lodging/camping results: add keywords to `lodging` or `long-stay-camping`.
- Need more scenic stops: add titles to `scenic-walk` or raise its priority.
- Need more museums/indoor stops: raise content type `14` or add keywords to `culture-stop`.
- A specific category should never appear: set its content type profile to `excluded: true`.

The policy runs before Kakao waypoint evaluation, so stronger filtering here can reduce unnecessary waypoint calls.

## Current Limits

The policy is intentionally simple:

- It does not yet know operating hours.
- It does not yet verify event dates.
- It estimates stay/walking/parking/accessibility.
- It filters to Gangwon addresses for the initial MVP.

Next improvements should come from TourAPI detail endpoints, barrier-free data, and observed demo results.
