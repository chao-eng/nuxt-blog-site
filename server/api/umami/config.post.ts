import dbUtils from '../../db'
import { setUmamiConfig } from '../../utils/config-state'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    dbUtils.umamiConfig.saveConfig({
      enableUmami: body.enableUmami,
      scriptUrl: body.scriptUrl,
      websiteId: body.websiteId,
      shareUrl: body.shareUrl
    })

    // 同步更新全局状态
    setUmamiConfig({
      enableUmami: body.enableUmami,
      scriptUrl: body.scriptUrl,
      websiteId: body.websiteId,
      shareUrl: body.shareUrl
    })

    return {
      success: true,
      message: 'Umami 配置已保存'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || '保存失败'
    })
  }
})
