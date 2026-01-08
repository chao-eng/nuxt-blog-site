import path from 'path'
import fs from 'fs/promises'
import dbUtils from '../../db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const basePath = useRuntimeConfig().basePath
    const deletePath = path.join(basePath, body.path)

    // 安全检查：确保删除路径在基础路径内
    const normalizedDeletePath = path.resolve(deletePath)
    const normalizedBasePath = path.resolve(basePath)

    if (!normalizedDeletePath.startsWith(normalizedBasePath)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid path: 路径不在允许的范围内'
      })
    }

    // 检查路径是否存在
    try {
      await fs.access(deletePath)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Path not found: 路径不存在'
      })
    }
    dbUtils.article.deleteArticleByPath(body.path)
    // 获取路径信息
    const stats = await fs.stat(deletePath)

    if (stats.isDirectory()) {
      // 删除目录（递归删除）
      await fs.rm(deletePath, { recursive: true, force: true })
    } else {
      // 删除文件
      await fs.unlink(deletePath)
    }

    return {
      success: true,
      err: '',
      data: {
        deletedPath: body.path,
        type: stats.isDirectory() ? 'directory' : 'file'
      }
    }
  } catch (error) {
    console.error('删除失败:', error)

    return {
      success: false,
      err: (error as Error).message || '删除操作失败',
      data: undefined
    }
  }
})
