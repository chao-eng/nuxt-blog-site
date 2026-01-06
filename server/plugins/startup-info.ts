// server/plugins/startup-info.ts
export default defineNitroPlugin((nitroApp) => {
  console.log('🚀 ========= APP 启动中 =========')
  console.log('📅 启动时间:', new Date().toISOString())
  console.log('🌍 启动环境:', process.env.NODE_ENV)
  console.log('🔌 启动端口:', process.env.PORT || process.env.NUXT_PORT || 3000)
  console.log('🏠 绑定域名:', process.env.HOST || process.env.NUXT_HOST || 'localhost')
  console.log('📁 启动目录:', process.cwd())

  // 打印运行时配置
  const config = useRuntimeConfig()
  console.log('🔑 公共环境变量:')
  console.log(JSON.stringify(config.public, null, 2))

  // 打印环境变量
  const nuxtVars = Object.keys(process.env)
    .filter(key => key.startsWith('NUXT_'))
    .reduce((obj, key) => {
      obj[key] = key.includes('SECRET') || key.includes('KEY') ? '***********' : process.env[key] ?? ''
      return obj
    }, {} as Record<string, string>)

  console.log('🌐 服务器环境变量:')
  console.log(JSON.stringify(nuxtVars, null, 2))

  console.log('=========================================')

  // 监听服务器启动完成
  nitroApp.hooks.hook('close', () => {
    console.log('🛑 APP 关闭中...')
  })
})
