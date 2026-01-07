import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import dbUtils from '../../db'

export default defineEventHandler(async (event) => {
  try {
    // 1. 清空数据库
    dbUtils.article.deleteAllArticles()

    // 2. 获取博客根目录
    const config = useRuntimeConfig()
    const basePath = config.basePath

    if (!fs.existsSync(basePath)) {
      throw createError({ statusCode: 500, message: '博客目录不存在' })
    }

    // 3. 遍历目录
    const entries = fs.readdirSync(basePath, { withFileTypes: true })
    let count = 0

    // 获取当前用户ID，默认为1（管理员）
    const userId = event.context.user?.userId || 1

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(basePath, entry.name)
        const mdPath = path.join(dirPath, 'index.md')

        if (fs.existsSync(mdPath)) {
          try {
            // 读取并解析
            const content = fs.readFileSync(mdPath, 'utf-8')
            const { data: frontMatter, content: mdBody } = matter(content)

            // 构造文章对象
            // 必须包含 title, date
            if (frontMatter.title && frontMatter.date) {
              const articleParams = {
                path: entry.name,
                title: frontMatter.title,
                date: frontMatter.date,
                description: frontMatter.description,
                image: frontMatter.image,
                tags: frontMatter.tags || [],
                published: frontMatter.published ?? false, // 保持原样，saveArticle 会处理
                isSticky: frontMatter.isSticky ?? false,
                content: mdBody, // 保存 MD 正文内容
                userid: userId
              }

              // 保存到数据库
              dbUtils.article.saveArticle(articleParams)
              count++
            }
          } catch (e) {
            console.error(`处理文章 ${entry.name} 失败:`, e)
          }
        }
      }
    }

    return {
      success: true,
      message: `成功重建索引，共处理 ${count} 篇文章`
    }
  } catch (error: any) {
    return {
      success: false,
      message: `重建索引失败: ${error.message}`
    }
  }
})
