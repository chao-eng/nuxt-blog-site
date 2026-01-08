import type { UploadResponse } from '~/types'
import { ref, readonly, type Ref } from 'vue'

interface UseUploadReturn {
  uploadImage: (file: File) => Promise<string | null>
  uploading: Readonly<Ref<boolean>>
  error: Readonly<Ref<string>>
  progress: Readonly<Ref<number>>
}

export const useUpload = (): UseUploadReturn => {
  const uploading = ref<boolean>(false)
  const error = ref<string>('')
  const progress = ref<number>(0)
  const toast = useToast()

  const uploadImage = async (file: File): Promise<string | null> => {
    uploading.value = true
    error.value = ''
    progress.value = 0

    try {
      // 客户端验证
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.add({
          title: '上传失败',
          description: '不支持的文件类型',
          duration: 3000,
          color: 'error'
        })
        error.value = '不支持的文件类型'
        return null
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.add({
          title: '上传失败',
          description: '文件大小不能超过 5MB',
          duration: 3000,
          color: 'error'
        })
        error.value = '文件大小不能超过 5MB'
        return null
      }

      // 使用 XMLHttpRequest 实现带进度监控的上传
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)

      return await new Promise<string | null>((resolve) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            progress.value = Math.round((event.loaded * 100) / event.total)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response: UploadResponse = JSON.parse(xhr.responseText)
              if (response.success) {
                toast.add({
                  title: '上传成功',
                  description: '图片已上传完成',
                  duration: 2000,
                  color: 'success'
                })
                resolve(response.url)
              } else {
                error.value = '上传失败'
                toast.add({
                  title: '上传失败',
                  description: '服务器返回错误',
                  duration: 3000,
                  color: 'error'
                })
                resolve(null)
              }
            } catch {
              error.value = '响应解析失败'
              toast.add({
                title: '上传失败',
                description: '响应解析失败',
                duration: 3000,
                color: 'error'
              })
              resolve(null)
            }
          } else {
            // 尝试解析错误信息
            let errorMessage = `HTTP ${xhr.status}`
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              errorMessage = errorResponse.statusMessage || errorMessage
            } catch {
              // 忽略解析错误，使用默认错误信息
            }

            error.value = errorMessage
            toast.add({
              title: '上传失败',
              description: errorMessage,
              duration: 3000,
              color: 'error'
            })
            resolve(null)
          }
        })

        xhr.addEventListener('error', () => {
          error.value = '网络错误'
          toast.add({
            title: '上传失败',
            description: '网络连接失败，请检查网络后重试',
            duration: 3000,
            color: 'error'
          })
          resolve(null)
        })

        xhr.addEventListener('timeout', () => {
          error.value = '上传超时'
          toast.add({
            title: '上传失败',
            description: '上传超时，请重试',
            duration: 3000,
            color: 'error'
          })
          resolve(null)
        })

        xhr.open('POST', '/api/upload')
        xhr.timeout = 30000 // 30秒超时
        xhr.send(formData)
      })
    } catch (err) {
      const errorMessage = (err as Error).message || '上传失败'
      error.value = errorMessage
      toast.add({
        title: '上传失败',
        description: errorMessage,
        duration: 3000,
        color: 'error'
      })
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  return {
    uploadImage,
    uploading: readonly(uploading),
    error: readonly(error),
    progress: readonly(progress)
  }
}
