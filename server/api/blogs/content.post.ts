import type { Result } from '~/types'
import path from 'path'
import { promisify } from 'node:util'
import fs from 'fs'
import matter from 'gray-matter'
import dbUtils from '../../db'

const readArticle = async (dir: string): Promise<Result<unknown>> => {
  try {
    // console.log('读取文章目录:', dir);

    // 先尝试从数据库获取文章内容
    const dbArticle = dbUtils.article.getArticleByPath(dir)

    let mdBody: string
    let frontMatter: Record<string, unknown>

    if (dbArticle && dbArticle.content) {
      // 从数据库读取内容
      mdBody = dbArticle.content
      frontMatter = {
        title: dbArticle.title,
        date: dbArticle.date,
        description: dbArticle.description,
        image: dbArticle.image,
        tags: dbArticle.tags,
        published: dbArticle.published,
        isSticky: dbArticle.isSticky,
        shortId: dbArticle.shortId
      }
    } else {
      // 回退到从文件系统读取
      const basePath = useRuntimeConfig().basePath
      const filePath = path.join(basePath, dir, 'index.md')
      const content = await promisify(fs.readFile)(filePath, 'utf8')
      const parsed = matter(content)
      frontMatter = parsed.data
      mdBody = parsed.content

      // 即使从文件读取内容，也要从数据库补充 shortId
      if (dbArticle && !frontMatter.shortId) {
        frontMatter.shortId = dbArticle.shortId
      }
    }

    const author = dbUtils.article.queryAuthor(dir)

    // 获取上一篇和下一篇
    const dateStr = typeof frontMatter.date === 'object' ? (frontMatter.date as Date).toISOString() : (frontMatter.date as string)
    const adjacent = dbUtils.article.getAdjacentArticles(dateStr, dir)

    return {
      success: true,
      err: '',
      data: {
        content: mdBody,
        frontMatter: frontMatter,
        author: author,
        adjacent: adjacent
      }
    }
  } catch (error) {
    console.error('读取文章内容失败:', (error as Error).message)
    return {
      success: false,
      err: '读取文章内容失败' + `${(error as Error).message}`,
      data: {}
    }
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await readArticle(body.path)
})
