// 保存评论配置（需要登录）
import dbUtils from '../../db'
import { setCommentsConfig } from '../../utils/config-state'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const config = {
      enableComments: body.enableComments === true,
      repo: body.repo || '',
      repoId: body.repoId || '',
      category: body.category || '',
      categoryId: body.categoryId || ''
    }

    dbUtils.commentConfig.saveConfig(config)

    // 同步更新全局状态
    setCommentsConfig(config)

    return {
      success: true,
      message: 'Comment configuration saved successfully'
    }
  } catch (error: unknown) {
    const typedError = error as { statusCode?: number }
    throw createError({
      statusCode: typedError.statusCode || 500,
      statusMessage: (error as Error).message || 'Failed to save comment configuration'
    })
  }
})
