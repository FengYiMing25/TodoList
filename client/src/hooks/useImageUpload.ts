import { useState, useCallback, useEffect, useRef } from 'react'
import { message } from 'antd'
import { uploadApi } from '@services/upload'

interface UseImageUploadOptions {
  maxSizeMB?: number
  entityType?: 'wardrobe' | 'user' | 'todo'
  entityId?: string
  initialImageUrl?: string
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

interface UseImageUploadReturn {
  imageUrl: string | undefined
  localPreview: string | null
  pendingFile: File | null
  uploading: boolean
  selectFile: (file: File) => boolean
  setImageUrl: (url: string | undefined) => void
  uploadPendingFile: (file?: File) => Promise<string | null>
  reset: () => void
}

export const useImageUpload = (options: UseImageUploadOptions = {}): UseImageUploadReturn => {
  const { maxSizeMB = 10, entityType, entityId, initialImageUrl, onSuccess, onError } = options

  const [imageUrl, setImageUrlState] = useState<string | undefined>(initialImageUrl)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const pendingFileRef = useRef<File | null>(null)
  const previewRef = useRef<string | null>(null)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

  useEffect(() => {
    pendingFileRef.current = pendingFile
  }, [pendingFile])

  useEffect(() => {
    previewRef.current = localPreview
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [localPreview])

  const selectFile = useCallback((file: File): boolean => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能选择图片文件')
      return false
    }

    const isLtMaxSize = file.size / 1024 / 1024 < maxSizeMB
    if (!isLtMaxSize) {
      message.error(`图片大小不能超过 ${maxSizeMB}MB`)
      return false
    }

    setLocalPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return URL.createObjectURL(file)
    })
    setPendingFile(file)
    pendingFileRef.current = file

    return true
  }, [maxSizeMB])

  const setImageUrl = useCallback((url: string | undefined) => {
    setImageUrlState(url)
    setLocalPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return null
    })
    setPendingFile(null)
    pendingFileRef.current = null
  }, [])

  const uploadPendingFile = useCallback(async (file?: File): Promise<string | null> => {
    const fileToUpload = file || pendingFileRef.current || pendingFile

    if (!fileToUpload) {
      return imageUrl || null
    }

    setUploading(true)
    try {
      const response = await uploadApi.uploadFile(fileToUpload, {
        entityType,
        entityId,
      })
      const url = response.attachment.url
      setImageUrlState(url)
      setPendingFile(null)
      pendingFileRef.current = null

      setLocalPreview((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return null
      })

      onSuccessRef.current?.(url)
      return url
    } catch (error) {
      const err = error instanceof Error ? error : new Error('上传失败')
      message.error('图片上传失败')
      onErrorRef.current?.(err)
      return null
    } finally {
      setUploading(false)
    }
  }, [pendingFile, imageUrl, entityType, entityId])

  const reset = useCallback(() => {
    setLocalPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return null
    })
    setImageUrlState(undefined)
    setPendingFile(null)
    pendingFileRef.current = null
    setUploading(false)
  }, [])

  return {
    imageUrl,
    localPreview,
    pendingFile,
    uploading,
    selectFile,
    setImageUrl,
    uploadPendingFile,
    reset,
  }
}

export default useImageUpload
