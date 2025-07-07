import { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  section?: string
  tags?: string[]
}

const DEFAULT_TITLE = 'IdeaVault - 검증된 마이크로 SaaS 아이디어 마켓플레이스'
const DEFAULT_DESCRIPTION = '바이브 코딩에 최적화된 검증된 마이크로 SaaS 아이디어와 구현 가이드를 거래하는 한국 최초의 전문 마켓플레이스입니다.'
const DEFAULT_KEYWORDS = [
  '마이크로 SaaS',
  '아이디어 마켓플레이스', 
  '바이브 코딩',
  'AI 개발',
  '스타트업',
  '사이드 프로젝트',
  '검증된 아이디어',
  '구현 가이드',
  '한국',
  'MVP',
  '창업',
  '개발자'
]
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ideavault.com'
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`

export function generateSEOMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  section,
  tags
}: SEOProps = {}): Metadata {
  
  const fullTitle = title ? `${title} | IdeaVault` : DEFAULT_TITLE
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL
  
  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    
    // Open Graph
    openGraph: {
      type,
      title: fullTitle,
      description,
      url: fullUrl,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        }
      ],
      siteName: 'IdeaVault',
      locale: 'ko_KR',
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: '@ideavault_kr',
      site: '@ideavault_kr',
    },
    
    // 추가 메타데이터
    alternates: {
      canonical: fullUrl,
    },
    
    // 로봇 메타데이터
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    
    // 언어 및 지역
    other: {
      'og:locale': 'ko_KR',
      'og:site_name': 'IdeaVault',
    }
  }
  
  // 기사 타입일 때 추가 메타데이터
  if (type === 'article') {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors,
      section,
      tags,
    }
  }
  
  return metadata
}

// 아이디어 상세 페이지용 SEO 메타데이터 생성
export function generateIdeaSEOMetadata(idea: {
  id: string
  title: string
  description: string
  category: string
  price: number
  tech_stack?: string[]
  seo_keywords?: string[]
  updated_at: string
  seller: {
    full_name: string
  }
}) {
  const title = idea.title
  const description = `${idea.description.slice(0, 150)}... | 가격: ${formatPrice(idea.price)} | 카테고리: ${idea.category}`
  const keywords = [
    ...DEFAULT_KEYWORDS,
    idea.category,
    ...(idea.tech_stack || []),
    ...(idea.seo_keywords || []),
    '아이디어',
    '구매',
    '다운로드'
  ]
  
  return generateSEOMetadata({
    title,
    description,
    keywords,
    url: `/ideas/${idea.id}`,
    type: 'article',
    modifiedTime: idea.updated_at,
    authors: [idea.seller.full_name],
    section: idea.category,
    tags: idea.tech_stack
  })
}

// 카테고리 페이지용 SEO 메타데이터 생성
export function generateCategorySEOMetadata(category: string, ideaCount: number) {
  const title = `${category} 아이디어`
  const description = `${category} 분야의 검증된 마이크로 SaaS 아이디어 ${ideaCount}개를 확인하세요. 바이브 코딩에 최적화된 구현 가이드와 함께 제공됩니다.`
  const keywords = [
    ...DEFAULT_KEYWORDS,
    category,
    `${category} 아이디어`,
    `${category} SaaS`,
    `${category} 스타트업`
  ]
  
  return generateSEOMetadata({
    title,
    description,
    keywords,
    url: `/ideas?category=${encodeURIComponent(category)}`
  })
}

// 가격 포맷팅 함수
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0
  }).format(price)
}

// 구조화된 데이터 생성 (JSON-LD)
export function generateStructuredData(type: 'website' | 'product' | 'organization', data: any) {
  switch (type) {
    case 'website':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'IdeaVault',
        description: DEFAULT_DESCRIPTION,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/ideas?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
      
    case 'product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: data.title,
        description: data.description,
        image: data.image || DEFAULT_IMAGE,
        brand: {
          '@type': 'Brand',
          name: 'IdeaVault'
        },
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: 'KRW',
          availability: 'https://schema.org/InStock',
          seller: {
            '@type': 'Person',
            name: data.seller?.full_name || '익명'
          }
        },
        category: data.category,
        aggregateRating: data.rating ? {
          '@type': 'AggregateRating',
          ratingValue: data.rating,
          ratingCount: data.reviewCount || 1
        } : undefined
      }
      
    case 'organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'IdeaVault',
        description: DEFAULT_DESCRIPTION,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        sameAs: [
          'https://twitter.com/ideavault_kr',
          'https://github.com/ideavault'
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: '고객지원',
          email: 'support@ideavault.com'
        }
      }
      
    default:
      return null
  }
}