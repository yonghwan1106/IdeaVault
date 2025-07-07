export const IDEA_CATEGORIES = [
  { value: 'ai-ml', label: 'AI/ML' },
  { value: 'productivity', label: '생산성 도구' },
  { value: 'collaboration', label: '협업 도구' },
  { value: 'fintech', label: '핀테크' },
  { value: 'ecommerce', label: '이커머스' },
  { value: 'education', label: '교육' },
  { value: 'healthcare', label: '헬스케어' },
  { value: 'marketing', label: '마케팅' },
  { value: 'analytics', label: '분석 도구' },
  { value: 'communication', label: '커뮤니케이션' },
  { value: 'developer-tools', label: '개발자 도구' },
  { value: 'design', label: '디자인' },
  { value: 'content', label: '콘텐츠 관리' },
  { value: 'automation', label: '자동화' },
  { value: 'security', label: '보안' },
  { value: 'gaming', label: '게임' },
  { value: 'social', label: '소셜' },
  { value: 'travel', label: '여행' },
  { value: 'food', label: '음식/배달' },
  { value: 'real-estate', label: '부동산' },
  { value: 'logistics', label: '물류' },
  { value: 'hr', label: '인사관리' },
  { value: 'legal', label: '법률' },
  { value: 'other', label: '기타' }
] as const

export const PACKAGE_TYPES = [
  {
    value: 'idea',
    label: '아이디어 패키지',
    description: '기본 아이디어 + 시장 검증',
    priceRange: '₩50,000 - ₩200,000',
    features: [
      '검증된 아이디어 개요서',
      '시장 조사 리포트',
      '경쟁사 분석',
      '수익모델 제안'
    ]
  },
  {
    value: 'mvp',
    label: 'MVP 설계도',
    description: '상세한 기술 구현 가이드',
    priceRange: '₩100,000 - ₩500,000',
    features: [
      '기능 명세서',
      'UI/UX 와이어프레임',
      '데이터베이스 설계',
      'Vibe Coding 프롬프트'
    ]
  },
  {
    value: 'launch_kit',
    label: '런치 키트',
    description: '완전한 창업 패키지',
    priceRange: '₩200,000 - ₩1,000,000',
    features: [
      '아이디어 + MVP 설계',
      '마케팅 전략',
      '고객 확보 가이드',
      '3개월 멘토링'
    ]
  }
] as const

export const TECH_STACK_OPTIONS = [
  'React',
  'Next.js',
  'Vue.js',
  'Angular',
  'Node.js',
  'Express',
  'FastAPI',
  'Django',
  'Flask',
  'Spring Boot',
  'Laravel',
  'Ruby on Rails',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'Firebase',
  'Supabase',
  'AWS',
  'Vercel',
  'Netlify',
  'Docker',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'React Native',
  'Flutter',
  'TailwindCSS',
  'Stripe',
  'OpenAI',
  'Anthropic',
  'WebRTC',
  'Socket.io',
  'GraphQL',
  'REST API',
  'Microservices'
] as const

export const REVENUE_MODELS = [
  { value: 'subscription', label: '구독 모델 (SaaS)' },
  { value: 'freemium', label: '프리미엄 모델' },
  { value: 'one-time', label: '일회성 구매' },
  { value: 'marketplace', label: '마켓플레이스 수수료' },
  { value: 'advertising', label: '광고 수익' },
  { value: 'affiliate', label: '제휴 마케팅' },
  { value: 'licensing', label: '라이선스' },
  { value: 'consulting', label: '컨설팅/서비스' },
  { value: 'transaction', label: '거래 수수료' },
  { value: 'data', label: '데이터 판매' }
] as const

export const REVENUE_MODEL_LABELS = REVENUE_MODELS.map(model => model.label)

export const DIFFICULTY_LEVELS = [
  { value: 1, label: '매우 쉬움', description: '기본 CRUD, 1-2주 구현' },
  { value: 2, label: '쉬움', description: '간단한 비즈니스 로직, 2-3주 구현' },
  { value: 3, label: '보통', description: '중간 복잡도, 4-6주 구현' },
  { value: 4, label: '어려움', description: '복잡한 로직, 2-3개월 구현' },
  { value: 5, label: '매우 어려움', description: '고급 기술 필요, 3개월+ 구현' }
] as const

export const MARKET_SIZES = [
  { value: 'niche', label: '틈새 시장 (< 1만명)' },
  { value: 'small', label: '소규모 (1만 - 10만명)' },
  { value: 'medium', label: '중간 규모 (10만 - 100만명)' },
  { value: 'large', label: '대규모 (100만 - 1000만명)' },
  { value: 'massive', label: '거대 시장 (1000만명+)' }
] as const