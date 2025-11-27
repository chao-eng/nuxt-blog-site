import fs from 'fs/promises'
import path from 'path'
import { createReadStream } from 'fs'

export default eventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const filePath = query.path as string

    // 验证文件路径参数
    if (!filePath) {
      return createError({
        statusCode: 400,
        statusMessage: '缺少文件路径参数'
      })
    }

    const basePath = useRuntimeConfig().staticPath
    const normalizedPath = path.join(basePath, filePath)

    // 防止目录遍历攻击
    if (normalizedPath.includes('..')) {
      return createError({
        statusCode: 403,
        statusMessage: '非法文件路径'
      })
    }

    // 检查文件是否存在且为文件类型
    const stats = await fs.stat(normalizedPath).catch(() => null)
    if (!stats?.isFile()) {
      return createError({
        statusCode: 404,
        statusMessage: '文件不存在'
      })
    }

    // 扩展支持的文件格式：新增 .md（Markdown）
    const ext = path.extname(normalizedPath).toLowerCase()
    const supportedExtensions = [
      // 原有图片格式
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp',
      // 新增 MD 格式
      '.md'
    ]

    if (!supportedExtensions.includes(ext)) {
      return createError({
        statusCode: 400,
        statusMessage: '不支持的文件格式'
      })
    }

    // 补充 MD 对应的 MIME 类型
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.md': 'text/markdown' // MD 文件的标准 MIME 类型
    }

    // 设置响应头
    setHeader(event, 'Content-Type', mimeTypes[ext] || 'application/octet-stream')
    setHeader(event, 'Content-Length', stats.size)
    setHeader(event, 'Cache-Control', 'public, max-age=3600') // 保持原有缓存策略，可按需调整

    // 流式传输文件（MD 文本文件同样适用流式传输）
    const readStream = createReadStream(normalizedPath)
    return sendStream(event, readStream)
  } catch (error: any) {
    if (error.statusCode) {
      return error
    }

    return createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  }
})
