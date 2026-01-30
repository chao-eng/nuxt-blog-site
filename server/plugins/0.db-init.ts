import type { NitroApp } from 'nitropack'
import { initDB } from '../db'

export default (nitroApp: NitroApp) => {
    console.log('🔌 [Plugin] 正在注册数据库初始化钩子...')

    // 在 Nitro 准备就绪时执行
    initDB()

    nitroApp.hooks.hook('close', () => {
        console.log('🛑 [Plugin] 正在关闭数据库连接...')
    })
}
