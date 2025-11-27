import dbUtils from '../db'
import { setUmamiConfig, setCommentsConfig } from '../utils/config-state'

export default defineNitroPlugin(async () => {
    console.log('🔧 Loading initial configurations from database...')

    try {
        // 加载 Umami 配置
        const umamiConfig = dbUtils.umamiConfig.getConfig()
        if (umamiConfig) {
            setUmamiConfig(umamiConfig)
            console.log('✅ Umami config loaded:', umamiConfig)
        }

        // 加载 Comments 配置
        const commentsConfig = dbUtils.commentConfig.getConfig()
        if (commentsConfig) {
            setCommentsConfig(commentsConfig)
            console.log('✅ Comments config loaded:', commentsConfig)
        }
    } catch (error) {
        console.error('❌ Failed to load configurations:', error)
    }
})
