import Link from 'next/link'
import { FileX } from 'lucide-react'

export default function IdeaNotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <FileX className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            아이디어를 찾을 수 없습니다
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            요청하신 아이디어가 존재하지 않거나 비공개 상태입니다.
          </p>
          <div className="space-x-4">
            <Link
              href="/ideas"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              아이디어 목록으로 돌아가기
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}