'use client'

import { useState, useRef } from 'react'
import { Upload, X, File, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { StorageService } from '@/lib/storage'
import toast from 'react-hot-toast'

interface FileUploadProps {
  type: 'image' | 'document'
  maxFiles?: number
  maxSizeMB?: number
  onUpload: (files: UploadedFile[]) => void
  userId: string
  ideaId?: string
  accept?: string
  className?: string
  placeholder?: string
}

export interface UploadedFile {
  id: string
  name: string
  url: string
  path: string
  size: number
  type: string
}

export default function FileUpload({
  type,
  maxFiles = 5,
  maxSizeMB = 10,
  onUpload,
  userId,
  ideaId,
  accept,
  className = '',
  placeholder
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const defaultAccept = type === 'image' 
    ? 'image/jpeg,image/jpg,image/png,image/webp'
    : 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip'

  const handleFileSelect = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles)
    
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`)
      return
    }

    uploadFiles(fileArray)
  }

  const uploadFiles = async (fileArray: File[]) => {
    setUploading(true)
    const uploadedFiles: UploadedFile[] = []

    try {
      for (const file of fileArray) {
        // Validate file
        const validation = StorageService.validateFile(file, type, maxSizeMB)
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`)
          continue
        }

        // Upload file
        let result
        if (type === 'image') {
          if (ideaId) {
            result = await StorageService.uploadIdeaImage(file, userId, ideaId)
          } else {
            // For avatar uploads
            result = await StorageService.uploadAvatar(file, userId)
          }
        } else {
          if (!ideaId) {
            toast.error('아이디어 ID가 필요합니다.')
            continue
          }
          result = await StorageService.uploadIdeaFile(file, userId, ideaId)
        }

        if (result.error) {
          toast.error(`${file.name} 업로드 실패: ${result.error}`)
          continue
        }

        const uploadedFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36),
          name: file.name,
          url: result.url,
          path: result.path,
          size: file.size,
          type: file.type
        }

        uploadedFiles.push(uploadedFile)
        toast.success(`${file.name} 업로드 완료`)
      }

      const newFiles = [...files, ...uploadedFiles]
      setFiles(newFiles)
      onUpload(newFiles)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('파일 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = async (fileToRemove: UploadedFile) => {
    try {
      const bucketType = type === 'image' 
        ? (ideaId ? 'idea-images' : 'avatar')
        : 'idea-files'
      
      await StorageService.deleteFile(bucketType, fileToRemove.path)
      
      const newFiles = files.filter(f => f.id !== fileToRemove.id)
      setFiles(newFiles)
      onUpload(newFiles)
      toast.success('파일이 삭제되었습니다.')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('파일 삭제에 실패했습니다.')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={accept || defaultAccept}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading}
        />

        <div className="space-y-2">
          <Upload className={`h-8 w-8 mx-auto ${dragOver ? 'text-blue-600' : 'text-gray-400'}`} />
          
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              {uploading ? '업로드 중...' : '파일 선택'}
            </button>
            <span className="text-gray-500"> 또는 드래그해서 업로드</span>
          </div>

          <p className="text-sm text-gray-500">
            {placeholder || `${type === 'image' ? '이미지' : '문서'} 파일을 업로드하세요`}
          </p>

          <div className="text-xs text-gray-400">
            <p>최대 {maxFiles}개 파일, 각각 {maxSizeMB}MB 이하</p>
            {type === 'image' ? (
              <p>지원 형식: JPG, PNG, WebP</p>
            ) : (
              <p>지원 형식: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP</p>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            업로드된 파일 ({files.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-gray-400">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {files.length >= maxFiles && (
        <div className="flex items-center space-x-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>최대 파일 개수에 도달했습니다.</span>
        </div>
      )}
    </div>
  )
}