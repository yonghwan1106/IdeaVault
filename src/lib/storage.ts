import { createClient } from './supabase-client'

const supabase = createClient()

export interface UploadResult {
  url: string
  path: string
  error?: string
}

export class StorageService {
  private static getBucketName(type: 'avatar' | 'idea-files' | 'idea-images'): string {
    switch (type) {
      case 'avatar':
        return 'avatars'
      case 'idea-files':
        return 'idea-files'
      case 'idea-images':
        return 'idea-images'
      default:
        throw new Error(`Unknown bucket type: ${type}`)
    }
  }

  private static generateFileName(originalName: string, userId: string, prefix?: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop()
    const baseName = prefix ? `${prefix}_` : ''
    return `${userId}/${baseName}${timestamp}_${random}.${extension}`
  }

  // Upload avatar image
  static async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    try {
      const bucketName = this.getBucketName('avatar')
      const fileName = this.generateFileName(file.name, userId, 'avatar')

      // Delete existing avatar if any
      const { data: existingFiles } = await supabase.storage
        .from(bucketName)
        .list(userId, {
          search: 'avatar_'
        })

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`)
        await supabase.storage.from(bucketName).remove(filesToDelete)
      }

      // Upload new avatar
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        return { url: '', path: '', error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path)

      return {
        url: urlData.publicUrl,
        path: data.path
      }
    } catch (error: unknown) {
      return { url: '', path: '', error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  // Upload idea-related files (documents, presentations, etc.)
  static async uploadIdeaFile(file: File, userId: string, ideaId: string): Promise<UploadResult> {
    try {
      const bucketName = this.getBucketName('idea-files')
      const fileName = this.generateFileName(file.name, userId, `idea_${ideaId}`)

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { url: '', path: '', error: error.message }
      }

      // Get public URL (will be protected by RLS)
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path)

      return {
        url: urlData.publicUrl,
        path: data.path
      }
    } catch (error: unknown) {
      return { url: '', path: '', error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  // Upload idea images (screenshots, diagrams, etc.)
  static async uploadIdeaImage(file: File, userId: string, ideaId: string): Promise<UploadResult> {
    try {
      const bucketName = this.getBucketName('idea-images')
      const fileName = this.generateFileName(file.name, userId, `idea_${ideaId}`)

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { url: '', path: '', error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path)

      return {
        url: urlData.publicUrl,
        path: data.path
      }
    } catch (error: unknown) {
      return { url: '', path: '', error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  // Delete file
  static async deleteFile(bucketType: 'avatar' | 'idea-files' | 'idea-images', filePath: string): Promise<{ error?: string }> {
    try {
      const bucketName = this.getBucketName(bucketType)
      
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath])

      if (error) {
        return { error: error.message }
      }

      return {}
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  // Get file list for user/idea
  static async listFiles(bucketType: 'avatar' | 'idea-files' | 'idea-images', folder: string) {
    try {
      const bucketName = this.getBucketName(bucketType)
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folder)

      if (error) {
        return { files: [], error: error.message }
      }

      return { files: data || [], error: null }
    } catch (error: unknown) {
      return { files: [], error: error instanceof Error ? error.message : 'Unknown error occurred' }
    }
  }

  // Validate file type and size
  static validateFile(file: File, type: 'image' | 'document', maxSizeMB: number = 10): { valid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return { valid: false, error: `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다.` }
    }

    // Check file type
    if (type === 'image') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'JPG, PNG, WebP 파일만 업로드 가능합니다.' }
      }
    } else if (type === 'document') {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed'
      ]
      if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP 파일만 업로드 가능합니다.' }
      }
    }

    return { valid: true }
  }
}