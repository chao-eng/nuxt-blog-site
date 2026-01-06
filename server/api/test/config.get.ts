export default defineEventHandler(() => {
    const config = useRuntimeConfig()

    return {
        success: true,
        timestamp: new Date().toISOString(),
        message: '运行时配置读取成功',
        config: {
            // 私有配置（仅服务端）
            staticPath: config.staticPath,
            basePath: config.basePath,
            dbPath: config.dbPath,
            authSecret: config.authSecret ? '***已设置***' : '❌ 未设置',
            authSecretLength: config.authSecret?.length || 0,

            // 公共配置
            appConfig: {
                navbarData: config.public.appConfig?.navbarData,
                footerData: config.public.appConfig?.footerData,
                seoData: config.public.appConfig?.seoData
            }
        },
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            platform: process.platform,
            nodeVersion: process.version
        },
        tips: [
            '✅ 如果看到配置值，说明环境变量已正确加载',
            '⚠️  authSecret 应该显示 "***已设置***"',
            '📝 appConfig 是编译时注入的，运行时不可修改',
            '🐳 Docker 部署时，通过 -e 参数覆盖这些配置'
        ]
    }
})
