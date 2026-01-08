import fs from 'fs/promises'
import path from 'path'
import { createReadStream } from 'fs'

export default eventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const filePath = query.path as string

    // 同样的验证逻辑...
    if (!filePath) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少文件路径参数'
      })
    }
    const basePath = useRuntimeConfig().basePath
    const normalizedPath = path.join(basePath, filePath)
    if (normalizedPath.includes('..')) {
      throw createError({
        statusCode: 403,
        statusMessage: '非法文件路径'
      })
    }

    // 检查文件
    const stats = await fs.stat(normalizedPath).catch(() => null)
    if (!stats?.isFile()) {
      throw createError({
        statusCode: 404,
        statusMessage: '文件不存在'
      })
    }

    // 检查文件格式
    const ext = path.extname(normalizedPath).toLowerCase()
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']

    if (!imageExtensions.includes(ext)) {
      throw createError({
        statusCode: 400,
        statusMessage: '不支持的图片格式'
      })
    }

    // 设置响应头
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp'
    }

    setHeader(event, 'Content-Type', mimeTypes[ext] || 'image/jpeg')
    setHeader(event, 'Content-Length', stats.size)
    setHeader(event, 'Cache-Control', 'public, max-age=3600')

    // 使用流式传输
    const readStream = createReadStream(normalizedPath)
    return sendStream(event, readStream)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  }
})
