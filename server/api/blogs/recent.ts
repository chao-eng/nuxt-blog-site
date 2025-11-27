import type { Article, Result } from '~/types'
import dbUtils from '../../db'

/**
 * 查询最近发布的文章
 */
const getRecentArticles = async (): Promise<Result<{ list: Article[], total: number }>> => {
  try {
    return {
      success: true,
      err: '',
      data: dbUtils.article.getArticles({ page: 1, pageSize: 3, sortBy: 'date', sortOrder: 'desc', isSticky: false })
    }
  } catch (error: any) {
    return {
      success: false,
      err: error.message,
      data: { list: [], total: 0 }
    }
  }
}

export default eventHandler(async () => {
  return await getRecentArticles()
})
