import { promises as fs } from 'fs'
import { join, resolve, relative } from 'path'
import { randomUUID } from 'crypto'
import type { Result } from '~/types'
import { uploadToS3 } from '../../utils/s3'

export default defineEventHandler(async (event): Promise<Result<unknown>> => {
  try {
    // 解析 multipart/form-data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return {
        success: false,
        err: '没有上传文件',
        data: null
      }
    }

    // 从查询参数或表单数据中获取上传路径
    const query = getQuery(event)
    let uploadPath = query.path as string

    // 如果查询参数中没有路径，尝试从表单数据中获取
    if (!uploadPath) {
      const pathField = formData.find(field => field.name === 'uploadPath')
      uploadPath = pathField?.data?.toString() || 'default'
    }

    // 清理和验证路径
    uploadPath = sanitizePath(uploadPath)

    // 获取图片文件（排除路径参数字段）
    const imageFiles = formData.filter(field =>
      field.filename && field.type?.startsWith('image/')
    )

    // 限制只能上传一个文件
    if (imageFiles.length === 0) {
      return {
        success: false,
        err: '没有上传文件',
        data: null
      }
    }

    if (imageFiles.length > 1) {
      return {
        success: false,
        err: '只允许上传一个图片文件',
        data: null
      }
    }

    const file = imageFiles[0]!

    // 构建完整的上传目录
    const basePath = useRuntimeConfig().basePath
    const baseUploadDir = join(basePath)
    const fullUploadDir = join(baseUploadDir, uploadPath)

    // 安全检查：确保上传路径在 uploads 目录内
    const relativePath = relative(baseUploadDir, fullUploadDir)
    if (relativePath.startsWith('..') || resolve(fullUploadDir) !== fullUploadDir) {
      return {
        success: false,
        err: '非法的上传路径',
        data: null
      }
    }

    // 确保上传目录存在
    try {
      await fs.access(fullUploadDir)
    } catch {
      await fs.mkdir(fullUploadDir, { recursive: true })
    }

    // 验证文件大小 (限制为 5MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.data.length > MAX_SIZE) {
      return {
        success: false,
        err: `文件 ${file.filename} 超过 10MB 大小限制`,
        data: null
      }
    }

    // 验证图片格式
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!file.type || !allowedTypes.includes(file.type)) {
      return {
        success: false,
        err: `不支持的图片格式: ${file.type}`,
        data: null
      }
    }

    // 生成唯一文件名
    const fileExtension = file.filename?.split('.').pop() || 'jpg'
    const uniqueFilename = `${randomUUID()}.${fileExtension}`

    // 尝试上传到 S3
    const s3Url = await uploadToS3(file.data, uniqueFilename, file.type || 'image/jpeg')

    if (s3Url) {
      return {
        success: true,
        err: '',
        data: {
          originalName: file.filename,
          filename: uniqueFilename,
          url: s3Url,
          path: uploadPath,
          size: file.data.length,
          type: file.type
        }
      }
    }

    const filePath = join(fullUploadDir, uniqueFilename)

    // 保存文件到指定路径
    await fs.writeFile(filePath, file.data)

    // 构建访问 URL
    const pathValue = `${uploadPath}/${uniqueFilename}`.replace(/\/+/g, '/')
    const accessUrl = `/api/article/fetch?path=${encodeURIComponent(pathValue)}`

    // 返回单个文件信息
    const uploadedFile = {
      originalName: file.filename,
      filename: uniqueFilename,
      url: accessUrl,
      path: uploadPath,
      fullPath: filePath,
      size: file.data.length,
      type: file.type
    }

    return {
      success: true,
      err: ``,
      data: uploadedFile // 注意：返回单个 file 而不是 files 数组
    }
  } catch (error: unknown) {
    // 处理其他错误
    console.error('文件上传错误:', error)

    const typedError = error as { statusCode?: number, statusMessage?: string }
    if (typedError.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '文件上传失败'
    })
  }
})

// 路径清理和验证函数
function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string') {
    return 'default'
  }

  // 移除危险字符和路径遍历
  return path
    .replace(/[<>:"|?*]/g, '') // 移除 Windows 非法字符
    .replace(/\.\./g, '') // 移除路径遍历
    .replace(/^\/+|\/+$/g, '') // 移除开头和结尾的斜杠
    .replace(/\/+/g, '/') // 合并多个斜杠
    .split('/')
    .filter(segment => segment.length > 0 && segment !== '.' && segment !== '..')
    .join('/')
    .slice(0, 100) // 限制路径长度
    || 'default' // 如果清理后为空，使用默认路径
}
