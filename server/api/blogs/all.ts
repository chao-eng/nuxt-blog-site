import dbUtils from '../../db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Number(query.pageSize) || 10
  const search = String(query.search || '')
  const tag = String(query.tag || '')

  try {
    const data = dbUtils.article.getArticles({
      page,
      pageSize,
      sortBy: 'date',
      sortOrder: 'desc',
      search,
      tag
    })

    return {
      success: true,
      err: '',
      data
    }
  } catch (error) {
    return {
      success: false,
      err: (error as Error).message,
      data: { list: [], total: 0 }
    }
  }
})
