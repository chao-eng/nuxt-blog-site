import type { Result } from '~/types'
import path from 'path'
import { promisify } from 'node:util'
import fs from 'fs'
import matter from 'gray-matter'
import dbUtils from '../../db'

const readArticle = async (dir: string): Promise<Result<any>> => {
  try {
    // console.log('读取文章目录:', dir);
    const basePath = useRuntimeConfig().basePath
    const filePath = path.join(basePath, dir, 'index.md')
    const content = await promisify(fs.readFile)(filePath, 'utf8')
    const { data: frontMatter, content: mdBody } = matter(content)
    // console.log('读取到的文章frontMatter:', frontMatter);
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
  } catch (error: any) {
    console.error('读取文章内容失败:', error.message)
    return {
      success: false,
      err: '读取文章内容失败' + `${error.message}`,
      data: {}
    }
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await readArticle(body.path)
})
