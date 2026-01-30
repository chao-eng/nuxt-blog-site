// 先导入所有模块
import { db, dbCommon } from './db'
import { dbUser, initUserTable } from './user'
import { dbArticle, initArticleTable } from './article'
import { dbTravel, initTravelTable } from './travel'
import { dbCommentConfig, dbUmamiConfig, dbS3Config, initSettingsTables } from './settings'

// 导出数据库连接和通用操作
export { db, dbCommon }

// 导出各模块的数据库操作
export { dbUser }
export { dbArticle }
export { dbTravel }
export { dbCommentConfig, dbUmamiConfig, dbS3Config }

/**
 * 初始化数据库（创建所有表，首次运行时执行）
 */
export function initDB(): void {
  console.log('🚀 [DB] 准备启动初始化流程...')
  try {
    initUserTable()
    console.log('✅ [DB] 用户系统就绪')
    initArticleTable()
    console.log('✅ [DB] 文章系统就绪')
    initTravelTable()
    initSettingsTables()
    console.log('✨ [DB] 数据库全部就绪')
  } catch (error: any) {
    console.error('❌ [DB] 初始化致命错误:', error.message)
  }
}

/**
 * 兼容旧版本的默认导出
 * 保持向后兼容，方便迁移
 */
const dbUtils = {
  common: dbCommon,
  article: dbArticle,
  travelRecords: dbTravel,
  commentConfig: dbCommentConfig,
  umamiConfig: dbUmamiConfig,
  s3Config: dbS3Config
}

export default dbUtils
