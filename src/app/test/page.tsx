'use client'

export const dynamic = 'force-dynamic'

export default function TestPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md mx-auto text-center space-y-4">
        <h1 className="text-4xl font-bold text-green-600">✅ 서버 로딩 성공!</h1>
        <p className="text-gray-600">Next.js 개발 서버가 정상적으로 작동하고 있습니다.</p>
        <p className="text-sm text-gray-500">타임스탬프: {new Date().toLocaleString()}</p>
        
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
          <h2 className="font-bold mb-2">환경변수 상태:</h2>
          <p className="text-sm">Supabase URL: {supabaseUrl ? '✅ 설정됨' : '❌ 누락'}</p>
          <p className="text-sm">Supabase Key: {hasSupabaseKey ? '✅ 설정됨' : '❌ 누락'}</p>
        </div>
        
        <div className="space-y-2">
          <a href="/" className="block p-2 bg-blue-500 text-white rounded hover:bg-blue-600">홈페이지로</a>
          <a href="/ideas" className="block p-2 bg-green-500 text-white rounded hover:bg-green-600">아이디어 페이지로</a>
          <a href="/signin" className="block p-2 bg-purple-500 text-white rounded hover:bg-purple-600">로그인 페이지로</a>
        </div>
      </div>
    </div>
  )
}