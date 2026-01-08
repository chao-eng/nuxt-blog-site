import path from 'path'
import { promisify } from 'node:util'
import * as fs from 'fs'
import type { Result } from '~/types'
import matter from 'gray-matter'

const readArticle = async (dir: string): Promise<Result<unknown>> => {
  try {
    // console.log('读取文章目录:', dir);
    const basePath = useRuntimeConfig().basePath
    const filePath = path.join(basePath, dir, 'index.md')
    const content = await promisify(fs.readFile)(filePath, 'utf8')
    const { data: frontMatter, content: mdBody } = matter(content)
    // console.log('读取到的文章frontMatter:', frontMatter);
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
