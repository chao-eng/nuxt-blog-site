import { getUmamiConfig } from '../../utils/config-state'

export default defineEventHandler(async (event) => {
  try {
    // 从全局状态读取配置（而不是数据库）
    const config = getUmamiConfig()

    return {
      success: true,
      data: config || {
        enableUmami: false,
        scriptUrl: '',
        websiteId: '',
        shareUrl: ''
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || '获取配置失败'
    })
  }
})
