import type { Article, Result } from '~/types'
import dbUtils from '../../db'

/**
 * 查询置顶文章
 */
const getStickyArticles = async (): Promise<Result<{ list: Article[], total: number }>> => {
  try {
    return {
      success: true,
      err: '',
      data: dbUtils.article.getArticles({
        page: 1,
        pageSize: 6, // 限制显示数量
        sortBy: 'date',
        sortOrder: 'desc',
        isSticky: true
      })
    }
  } catch (error) {
    return {
      success: false,
      err: (error as Error).message,
      data: { list: [], total: 0 }
    }
  }
}

export default eventHandler(async () => {
  return await getStickyArticles()
})
