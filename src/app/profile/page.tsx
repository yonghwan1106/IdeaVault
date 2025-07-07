'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FileUpload, { UploadedFile } from '@/components/ui/FileUpload'
import toast from 'react-hot-toast'
import { Camera, Save, User, Mail, Globe, MapPin, Tag } from 'lucide-react'
import Image from 'next/image'

export default function ProfilePage() {
  const { user, userProfile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    username: userProfile?.username || '',
    bio: userProfile?.bio || '',
    location: userProfile?.location || '',
    website_url: userProfile?.website_url || '',
    user_type: userProfile?.user_type || 'buyer',
    expertise_tags: userProfile?.expertise_tags || [],
  })

  const [newTag, setNewTag] = useState('')
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)

  const handleAvatarUpload = async (files: UploadedFile[]) => {
    if (files.length > 0) {
      const avatarFile = files[0]
      try {
        const { error } = await updateProfile({ avatar_url: avatarFile.url })
        if (error) {
          toast.error('아바타 업데이트에 실패했습니다.')
        } else {
          toast.success('프로필 사진이 업데이트되었습니다!')
          setShowAvatarUpload(false)
        }
      } catch {
        toast.error('아바타 업데이트 중 오류가 발생했습니다.')
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      if (formData.expertise_tags.length < 10 && !formData.expertise_tags.includes(newTag.trim())) {
        setFormData(prev => ({
          ...prev,
          expertise_tags: [...prev.expertise_tags, newTag.trim()]
        }))
        setNewTag('')
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      expertise_tags: prev.expertise_tags.filter((tag: string) => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await updateProfile(formData)
      
      if (error) {
        toast.error('프로필 업데이트에 실패했습니다.')
      } else {
        toast.success('프로필이 업데이트되었습니다!')
      }
    } catch {
      toast.error('프로필 업데이트 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">프로필 설정</h1>
              <p className="mt-1 text-sm text-gray-600">
                다른 사용자들이 볼 수 있는 프로필 정보를 관리하세요.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <Image
                    className="h-20 w-20 rounded-full object-cover"
                    src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || user?.email || 'User')}&background=3b82f6&color=ffffff&size=200`}
                    alt="프로필 사진"
                    width={80}
                    height={80}
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarUpload(!showAvatarUpload)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    프로필 사진 변경
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    JPG, PNG, WebP. 최대 10MB.
                  </p>
                </div>
              </div>

              {/* Avatar Upload */}
              {showAvatarUpload && user && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <FileUpload
                    type="image"
                    maxFiles={1}
                    maxSizeMB={10}
                    onUpload={handleAvatarUpload}
                    userId={user.id}
                    placeholder="프로필 사진을 업로드하세요"
                    className="mb-4"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAvatarUpload(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    취소
                  </button>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    <User className="inline h-4 w-4 mr-1" />
                    이름
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="홍길동"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    사용자명
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="username"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    프로필 URL에 사용됩니다.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  <Mail className="inline h-4 w-4 mr-1" />
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  이메일은 변경할 수 없습니다.
                </p>
              </div>

              <div>
                <label htmlFor="user_type" className="block text-sm font-medium text-gray-700">
                  사용자 유형
                </label>
                <select
                  name="user_type"
                  id="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="buyer">구매자 - 아이디어를 구매하고 구현</option>
                  <option value="seller">판매자 - 검증된 아이디어 판매</option>
                  <option value="both">둘 다 - 구매와 판매 모두</option>
                </select>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  자기소개
                </label>
                <textarea
                  name="bio"
                  id="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="간단한 자기소개를 작성해보세요..."
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    위치
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="서울, 대한민국"
                  />
                </div>

                <div>
                  <label htmlFor="website_url" className="block text-sm font-medium text-gray-700">
                    <Globe className="inline h-4 w-4 mr-1" />
                    웹사이트
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    id="website_url"
                    value={formData.website_url}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Expertise Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  전문 분야 태그
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.expertise_tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="태그를 입력하고 Enter를 누르세요 (최대 10개)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  예: React, Node.js, 스타트업, AI, 디자인
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? '저장 중...' : '프로필 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Account Settings */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">계정 설정</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">이메일 알림</h4>
                  <p className="text-sm text-gray-500">새로운 메시지와 활동에 대한 알림을 받습니다.</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  defaultChecked
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">마케팅 알림</h4>
                  <p className="text-sm text-gray-500">새로운 기능과 프로모션에 대한 정보를 받습니다.</p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button className="text-sm text-red-600 hover:text-red-500">
                  계정 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}