// 保存旅行记录（需要登录）
import dbUtils from '../../db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Data is required'
      })
    }

    // 验证是否为有效的 JSON 字符串
    let jsonData: string
    if (typeof body.data === 'string') {
      jsonData = body.data
    } else {
      jsonData = JSON.stringify(body.data)
    }

    // 获取 visible 参数，默认为 true
    const visible = body.visible !== undefined ? body.visible : true

    dbUtils.travelRecords.saveTravelRecords(jsonData, visible)

    return {
      success: true,
      message: 'Travel records saved successfully'
    }
  } catch (error: unknown) {
    const typedError = error as { statusCode?: number }
    throw createError({
      statusCode: typedError.statusCode || 500,
      statusMessage: (error as Error).message || 'Failed to save travel records'
    })
  }
})
