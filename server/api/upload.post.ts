// server/api/upload.post.ts
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { uploadToS3 } from '../utils/s3'
import type { UploadResponse, FileValidation } from '~/types'

const config: FileValidation = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
}

export default defineEventHandler(async (event): Promise<UploadResponse> => {
  try {
    const form = await readMultipartFormData(event)

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    const file = form[0]!

    // 类型验证
    if (!file.type || !config.allowedTypes.includes(file.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid file type. Allowed: ${config.allowedTypes.join(', ')}`
      })
    }

    // 大小验证
    if (file.data.length > config.maxSize) {
      throw createError({
        statusCode: 400,
        statusMessage: `File too large. Max size: ${config.maxSize / 1024 / 1024}MB`
      })
    }

    // 生成安全的文件名
    const fileExtension = file.filename?.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${randomUUID()}.${fileExtension}`

    // 检查 S3 配置并尝试上传
    const s3Url = await uploadToS3(file.data, fileName, file.type || 'image/jpeg')

    if (s3Url) {
      return {
        success: true,
        url: s3Url,
        filename: fileName,
        originalName: file.filename,
        size: file.data.length
      }
    } else {
      // 传统的本地上传逻辑
      // 确保上传目录存在
      const uploadsDir = join(useRuntimeConfig().staticPath)
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const uploadPath = join(uploadsDir, fileName)

      // 保存文件
      await writeFile(uploadPath, file.data)

      return {
        success: true,
        url: `/api/fetch?path=${fileName}`,
        filename: fileName,
        originalName: file.filename,
        size: file.data.length
      }
    }
  } catch (error: unknown) {
    console.error('Upload error:', error)

    const typedError = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: typedError.statusCode || 500,
      statusMessage: typedError.statusMessage || 'Upload failed'
    })
  }
})
