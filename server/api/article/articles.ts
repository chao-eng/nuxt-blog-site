import fs from 'fs/promises'
import path from 'path'
import type { Result, Article } from '~/types' // 确保 Article 类型已定义
import dbUtils from '../../db'

// 注意：需在 Article 类型中添加 modifyTime 字段（后面会说明）
const getArticles = async (): Promise<Result<Article[]>> => {
  const basePath = useRuntimeConfig().basePath
  // console.log('basePath:', basePath);
  // 校验 basePath 是否存在，避免路径错误
  if (!basePath) {
    return {
      success: false,
      err: '未配置文章根目录（basePath 为空）',
      data: []
    }
  }

  const dir = path.join(basePath)
  try {
    // 1. 读取目录列表（保留原有逻辑）
    const dirents = await fs.readdir(dir, { withFileTypes: true })
    if (!dirents || dirents.length === 0) {
      return {
        success: false,
        err: '文件列表为空',
        data: []
      }
    }
    // 读取数据库中的文章列表，找出已保存的文章
    const articlePaths: { path: string }[] = dbUtils.article.getAllArticlePaths()

    const articles: Article[] = []
    // 2. 遍历目录，获取每个目录的修改时间
    for (const dirent of dirents) {
      const fullPath = path.join(dir, dirent.name)

      // 只处理目录（保留原有逻辑）
      if (dirent.isDirectory()) {
        try {
          // 关键：通过 stat 获取目录的详细信息（含修改时间）
          const stats = await fs.stat(fullPath)
          // 收集文章信息，新增 modifyTime 字段（存储最后修改时间）
          articles.push({
            content: '', // 内容仍为空（需后续单独获取）
            path: path.basename(fullPath), // 目录名
            modifyTime: stats.mtime.toISOString(), // mtime 是 Date 类型，代表最后修改时间
            isSaved: articlePaths.some(item => item.path === path.basename(fullPath)),
            title: path.basename(fullPath),
            date: stats.birthtime.toISOString(),
            description: null,
            image: null,
            tags: [],
            published: false,
            author: '',
            avatar: '',
            newBlog: false,
            isSticky: false
          })
        } catch (statError: unknown) {
          // 单独捕获某个目录的 stat 错误（避免单个目录异常导致整个循环中断）
          console.error(`获取目录 ${fullPath} 信息失败:`, (statError as Error).message)
          // 可选：跳过错误目录，或添加标记为异常的文章
          articles.push({
            content: '',
            path: path.basename(fullPath),
            modifyTime: new Date(0).toISOString(), // 用“1970-01-01”标记异常目录
            isSaved: false,
            title: path.basename(fullPath),
            date: new Date(0).toISOString(),
            description: null,
            image: null,
            tags: [],
            published: false,
            author: '',
            avatar: '',
            newBlog: false,
            isSticky: false
          })
        }
      }
    }

    // 3. 按修改时间倒序排序（最新修改的排在前面）
    const sortedArticles = articles.sort((a, b) => {
      // mtime 是 ISO 字符串，直接比较字符串即可
      return b.modifyTime.localeCompare(a.modifyTime)
    })

    // 4. 返回排序后的结果
    return {
      success: true,
      err: '',
      data: sortedArticles
    }
  } catch (error: unknown) {
    console.error('读取文章目录失败:', (error as Error).message)
    return {
      success: false,
      err: `获取文章列表失败：${(error as Error).message}`,
      data: []
    }
  }
}
export default eventHandler(async (_event) => {
  return await getArticles()
})
