import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase'
import { generateIdeaSEOMetadata, generateStructuredData } from '@/lib/seo'
import IdeaDetailClient from './IdeaDetailClient'

interface Idea {
  id: string
  title: string
  description: string
  category: string
  package_type: 'idea' | 'mvp' | 'launch_kit'
  price: number
  target_audience: string
  revenue_model: string
  implementation_difficulty: number
  estimated_dev_time: string
  tech_stack: string[]
  market_size: string
  preview_content: string
  full_content: string
  seo_keywords: string[]
  view_count: number
  status: string
  validation_status: string
  created_at: string
  updated_at: string
  published_at: string
  seller_id: string
  seller: {
    id: string
    full_name: string
    avatar_url: string
    username: string
    bio: string
    expertise_tags: string[]
    verified: boolean
  }
}

interface PageProps {
  params: { id: string }
}

// Function to fetch idea data for metadata
async function fetchIdeaForMetadata(id: string): Promise<Idea | null> {
  const supabase = createServerComponentClient()
  
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        *,
        users:seller_id (
          id,
          full_name,
          avatar_url,
          username,
          bio,
          expertise_tags,
          verified
        )
      `)
      .eq('id', id)
      .eq('status', 'active')
      .eq('validation_status', 'approved')
      .single()

    if (error || !data) {
      return null
    }

    return {
      ...data,
      seller: data.users
    }
  } catch (error) {
    console.error('Error fetching idea for metadata:', error)
    return null
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const idea = await fetchIdeaForMetadata(params.id)
  
  if (!idea) {
    return {
      title: '아이디어를 찾을 수 없습니다 | IdeaVault',
      description: '요청하신 아이디어가 존재하지 않거나 비공개 상태입니다.',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return generateIdeaSEOMetadata(idea)
}


export default async function IdeaDetailPage({ params }: PageProps) {
  const idea = await fetchIdeaForMetadata(params.id)
  
  if (!idea) {
    notFound()
  }

  // Generate structured data for the idea
  const structuredData = generateStructuredData('product', {
    title: idea.title,
    description: idea.description,
    price: idea.price,
    category: idea.category,
    seller: idea.seller
  })

  return (
    <>
      {/* Structured Data (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      {/* Client component that handles all the interactive functionality */}
      <IdeaDetailClient idea={idea} ideaId={params.id} />
    </>
  )
}

