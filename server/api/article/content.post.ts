import path from 'path'
import { promisify } from 'node:util'
import * as fs from 'fs'
import type { Result } from '~/types'
import matter from 'gray-matter'
import dbUtils from '../../db'

const readArticle = async (dir: string): Promise<Result<unknown>> => {
  try {
    // console.log('读取文章目录:', dir);
    const basePath = useRuntimeConfig().basePath
    const filePath = path.join(basePath, dir, 'index.md')
    const content = await promisify(fs.readFile)(filePath, 'utf8')
    const { data: frontMatter, content: mdBody } = matter(content)

    // 从数据库补充元数据（如 shortId）
    const dbArticle = dbUtils.article.getArticleByPath(dir)
    if (dbArticle && dbArticle.shortId && !frontMatter.shortId) {
      frontMatter.shortId = dbArticle.shortId
    }

    return {
      success: true,
      err: '',
      data: {
        content: mdBody,
        frontMatter: frontMatter
      }
    }
  } catch (error: unknown) {
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
