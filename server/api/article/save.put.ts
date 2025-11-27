import fs from 'fs'
import path from 'path'
import type { Result } from '~/types/index.js'
import dbUtils from '../../db'
import matter from 'gray-matter'

const saveArticle = async (dir: string, content: string, originalPath: string, userid: number): Promise<Result<undefined>> => {
  try {
    const basePath = useRuntimeConfig().basePath
    // 计算新目录的完整路径（目标目录）
    const newDirPath = path.join(basePath, dir)
    // 目标文件路径（基于新目录）
    const filePath = path.join(newDirPath, 'index.md')

    // 处理原目录：如果存在则重命名为新目录
    if (originalPath && originalPath.trim() !== '') {
      // 解析原路径和新路径为绝对路径（避免相对路径导致的问题）
      const originalAbsPath = path.resolve(path.join(basePath, originalPath))
      const newDirAbsPath = path.resolve(newDirPath)

      // 原路径和新路径不同时才执行操作（避免重复处理）
      if (originalAbsPath !== newDirAbsPath) {
        // 检查原目录是否存在
        if (fs.existsSync(originalAbsPath)) {
          // 验证原路径是否为目录（避免误操作文件）
          const originalStat = fs.statSync(originalAbsPath)
          if (!originalStat.isDirectory()) {
            throw new Error(`原路径 "${originalAbsPath}" 不是目录，无法重命名`)
          }

          // 如果新目录已存在，先删除（避免重命名冲突）
          if (fs.existsSync(newDirAbsPath)) {
            fs.rmSync(newDirAbsPath, { recursive: true, force: true }) // 递归删除目录及内容
          }

          // 重命名原目录为新目录
          fs.renameSync(originalAbsPath, newDirAbsPath)
        }
      }
    }

    // 确保父目录存在（如果原目录不存在，这里会创建新目录；如果已重命名，此操作会跳过）
    const parentDir = path.dirname(filePath)
    fs.mkdirSync(parentDir, { recursive: true })

    // 写入文章内容
    fs.writeFileSync(filePath, content, 'utf8')

    // 更新数据库
    if (originalPath) {
      dbUtils.article.deleteArticleByPath(originalPath)
    }
    const { data: frontMatter, content: mdBody } = matter(content)
    // console.log('frontMatter:', frontMatter);
    dbUtils.article.saveArticle({
      path: dir,
      title: frontMatter.title,
      description: frontMatter.description,
      date: frontMatter.date,
      tags: frontMatter.tags,
      image: frontMatter.image,
      published: frontMatter.published,
      isSticky: frontMatter.isSticky,
      userid: userid
    })

    return {
      success: true,
      err: '',
      data: undefined
    }
  } catch (error: any) {
    console.error('保存文章内容失败:', error.message)
    return {
      success: false,
      err: `保存文章内容失败: ${error.message}`,
      data: undefined
    }
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await saveArticle(body.path, body.content, body.originalPath, event.context.user.userId)
})
