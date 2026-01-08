import { getCommentsConfig } from '../../utils/config-state'

export default defineEventHandler(async (_event) => {
  try {
    // 从全局状态读取配置（而不是数据库）
    const config = getCommentsConfig()

    return {
      success: true,
      data: config || {
        enableComments: false,
        repo: '',
        repoId: '',
        category: '',
        categoryId: ''
      }
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: (error as Error).message || '获取配置失败'
    })
  }
})
