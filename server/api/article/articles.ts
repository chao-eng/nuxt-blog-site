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
    // 读取数据库中的文章元数据列表（传入 published: null 以获取包括草稿在内的所有文章）
    const dbArticles = dbUtils.article.getArticles({ pageSize: 1000, published: null })
    const dbArticlesMap = new Map(dbArticles.list.map(a => [a.path, a]))

    const articles: Article[] = []
    // 2. 遍历目录，获取每个目录的修改时间
    for (const dirent of dirents) {
      const fullPath = path.join(dir, dirent.name)
      const articlePath = dirent.name

      // 只处理目录
      if (dirent.isDirectory()) {
        try {
          const stats = await fs.stat(fullPath)
          const dbArticle = dbArticlesMap.get(articlePath)

          if (dbArticle) {
            // 如果数据库中有记录，合并数据库信息
            articles.push({
              ...dbArticle,
              isSaved: true,
              modifyTime: stats.mtime.toISOString(), // 仍然优先使用文件系统的修改时间，或合并
              content: '' // 列表页不传内容
            })
          } else {
            // 如果数据库中没有记录，使用文件系统默认信息
            articles.push({
              content: '',
              path: articlePath,
              modifyTime: stats.mtime.toISOString(),
              isSaved: false,
              title: articlePath,
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
          }
        } catch (statError: unknown) {
          console.error(`获取目录 ${fullPath} 信息失败:`, (statError as Error).message)
          articles.push({
            content: '',
            path: articlePath,
            modifyTime: new Date(0).toISOString(),
            isSaved: false,
            title: articlePath,
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
