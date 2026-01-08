// 获取旅行记录（公开接口，无需登录）
import dbUtils from '../../db'

export default defineEventHandler(() => {
  try {
    const result = dbUtils.travelRecords.getTravelRecords()
    return {
      success: true,
      data: JSON.parse(result.data),
      visible: result.visible
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: (error as Error).message || 'Failed to get travel records'
    })
  }
})
