const contentTypeProfiles = {
  '12': {
    category: 'view',
    basePriority: 70,
    tags: ['관광지', 'TourAPI'],
    stayMinutes: 50,
    walkingMinutes: 15,
    indoor: false,
    kidFriendly: true,
    label: '관광지',
  },
  '14': {
    category: 'barrierFree',
    basePriority: 68,
    tags: ['문화시설', '실내'],
    stayMinutes: 45,
    walkingMinutes: 8,
    indoor: true,
    kidFriendly: true,
    label: '문화시설',
  },
  '15': {
    category: 'officialCourse',
    basePriority: 34,
    tags: ['행사/축제', '기간확인'],
    stayMinutes: 60,
    walkingMinutes: 20,
    indoor: false,
    kidFriendly: true,
    label: '행사/축제',
  },
  '25': {
    category: 'officialCourse',
    basePriority: 64,
    tags: ['여행코스', '공식정보'],
    stayMinutes: 60,
    walkingMinutes: 25,
    indoor: false,
    kidFriendly: true,
    label: '여행코스',
  },
  '28': {
    category: 'walk',
    basePriority: 36,
    tags: ['레포츠', '활동'],
    stayMinutes: 60,
    walkingMinutes: 25,
    indoor: false,
    kidFriendly: false,
    label: '레포츠',
  },
  '32': {
    category: 'rest',
    basePriority: -90,
    tags: ['숙박'],
    stayMinutes: 0,
    walkingMinutes: 0,
    indoor: true,
    kidFriendly: false,
    label: '숙박',
    excluded: true,
  },
  '38': {
    category: 'rest',
    basePriority: 8,
    tags: ['쇼핑', '휴식'],
    stayMinutes: 45,
    walkingMinutes: 8,
    indoor: true,
    kidFriendly: false,
    label: '쇼핑',
  },
  '39': {
    category: 'cafe',
    basePriority: 4,
    tags: ['음식점', '휴식'],
    stayMinutes: 40,
    walkingMinutes: 8,
    indoor: true,
    kidFriendly: false,
    label: '음식점',
  },
};

const titleBoostRules = [
  {
    id: 'scenic-walk',
    keywords: ['전망대', '전망', '공원', '해변', '해수욕장', '숲', '수목원', '휴양림', '산책', '둘레길', '생태', '호수', '계곡'],
    priority: 28,
    tags: ['전망/산책'],
  },
  {
    id: 'culture-stop',
    keywords: ['박물관', '미술관', '전시', '기념관', '문화', '역사', '유적', '사찰', '절', '성당'],
    priority: 24,
    tags: ['문화'],
  },
  {
    id: 'market-street',
    keywords: ['시장', '거리', '골목', '마을', '항구', '항', '등대'],
    priority: 14,
    tags: ['지역체험'],
  },
  {
    id: 'light-rest',
    keywords: ['카페', '커피', '찻집', '정원'],
    priority: 6,
    tags: ['가벼운 휴식'],
  },
];

const penaltyRules = [
  {
    id: 'lodging',
    keywords: ['호텔', '모텔', '펜션', '리조트', '민박', '게스트하우스', '숙박'],
    priority: -100,
    excluded: true,
    reason: '숙박 항목은 자투리 경유 목적과 맞지 않아 제외합니다.',
  },
  {
    id: 'long-stay-camping',
    keywords: ['캠핑장', '글램핑', '야영장', '카라반'],
    priority: -18,
    reason: '캠핑/야영 항목은 체류 시간이 길 수 있어 우선순위를 낮춥니다.',
  },
  {
    id: 'generic-food',
    keywords: ['식당', '숯불', '갈비', '횟집', '막국수', '닭갈비', '감자옹심이', '한우'],
    priority: -12,
    reason: '일반 음식점은 보조 휴식 후보로 낮게 둡니다.',
  },
];

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, '').toLowerCase();
}

function textHasAny(text, keywords) {
  const normalized = normalizeText(text);

  return keywords.some((keyword) => normalized.includes(normalizeText(keyword)));
}

function areaFromAddress(address) {
  const parts = String(address ?? '').split(/\s+/).filter(Boolean);

  return parts[1] ?? parts[0] ?? '강원';
}

function isGangwonAddress(address) {
  const text = String(address ?? '');

  return text.includes('강원');
}

function evaluateTourApiItem(item) {
  const contentTypeId = String(item.contenttypeid ?? '12');
  const profile = contentTypeProfiles[contentTypeId] ?? contentTypeProfiles['12'];
  const title = String(item.title ?? '');
  const address = [item.addr1, item.addr2].filter(Boolean).join(' ');
  let priority = profile.basePriority;
  let excluded = Boolean(profile.excluded);
  const tags = [...profile.tags];
  const reasons = [`TourAPI ${profile.label} 분류입니다.`];

  if (!isGangwonAddress(address)) {
    priority -= 100;
    excluded = true;
    reasons.push('초기 MVP는 강원 주소 후보만 사용합니다.');
  }

  for (const rule of titleBoostRules) {
    if (textHasAny(title, rule.keywords)) {
      priority += rule.priority;
      tags.push(...rule.tags);
      reasons.push(`${rule.tags[0]} 키워드가 있어 우선순위를 높였습니다.`);
    }
  }

  for (const rule of penaltyRules) {
    if (textHasAny(`${title} ${address}`, rule.keywords)) {
      priority += rule.priority;
      if (rule.excluded) excluded = true;
      reasons.push(rule.reason);
    }
  }

  return {
    contentTypeId,
    priority,
    excluded,
    tags: [...new Set(tags)],
    reasons: [...new Set(reasons)].slice(0, 4),
    profile,
  };
}

export function mapTourApiItemToTravelSpot(item) {
  const latitude = Number(item.mapy);
  const longitude = Number(item.mapx);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !item.contentid || !item.title) {
    return null;
  }

  const evaluation = evaluateTourApiItem(item);
  const address = [item.addr1, item.addr2].filter(Boolean).join(' ');
  const indoor = evaluation.profile.indoor;

  return {
    id: `tour-${item.contentid}`,
    name: String(item.title),
    category: evaluation.profile.category,
    address: address || '주소 정보 확인 필요',
    area: areaFromAddress(address),
    coordinate: { latitude, longitude },
    imageUrl:
      item.firstimage ||
      item.firstimage2 ||
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    summary: `TourAPI 위치기반 관광정보로 가져온 후보입니다. ${evaluation.reasons[0]}`,
    sourceLabel: 'TourAPI 위치기반 관광정보',
    officialTags: evaluation.tags,
    stayMinutes: evaluation.profile.stayMinutes,
    walkingMinutes: evaluation.profile.walkingMinutes,
    parking: false,
    barrierFree: false,
    kidFriendly: evaluation.profile.kidFriendly,
    indoor,
    weatherFit: indoor ? ['any', 'rain'] : ['any', 'sunny'],
    openNow: true,
    navKeyword: String(item.title),
    candidateMeta: {
      source: 'tourApi',
      contentTypeId: evaluation.contentTypeId,
      priority: evaluation.priority,
      excluded: evaluation.excluded,
      reasons: evaluation.reasons,
    },
  };
}

export function selectTourApiCandidates(spots, limit) {
  return spots
    .filter((spot) => !spot.candidateMeta?.excluded)
    .sort((a, b) => (b.candidateMeta?.priority ?? 0) - (a.candidateMeta?.priority ?? 0))
    .slice(0, limit);
}

export function rankRouteCandidates(spots, limit) {
  return spots
    .map((spot) => {
      const priority = spot.candidateMeta?.priority ?? 30;
      const routePenalty = (spot.routeCorridorDistanceMeters ?? 0) / 1000;

      return {
        ...spot,
        routeCandidateScore: priority - routePenalty * 1.8,
      };
    })
    .sort((a, b) => b.routeCandidateScore - a.routeCandidateScore)
    .slice(0, limit);
}
