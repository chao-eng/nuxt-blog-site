import dbUtils from '../../db'
import type { Result } from '~/types'

const getArticleTags = async (): Promise<Result<any>> => {
  try {
    return {
      success: true,
      err: '',
      data: dbUtils.article.getTagsWithCount()
    }
  } catch (error: any) {
    return {
      success: false,
      err: error.message,
      data: []
    }
  }
}

export default eventHandler(async () => {
  return await getArticleTags()
})
