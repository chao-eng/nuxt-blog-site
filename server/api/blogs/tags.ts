import dbUtils from '../../db'
import type { Result } from '~/types'

const getArticleTags = async (): Promise<Result<{ tag: string, count: number }[]>> => {
  try {
    return {
      success: true,
      err: '',
      data: dbUtils.article.getTagsWithCount()
    }
  } catch (error) {
    return {
      success: false,
      err: (error as Error).message,
      data: []
    }
  }
}

export default eventHandler(async () => {
  return await getArticleTags()
})
