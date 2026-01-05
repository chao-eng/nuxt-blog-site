export default defineNuxtPlugin(async (nuxtApp) => {
  // 仅在客户端执行
  if (import.meta.client) {
    try {
      // 获取 Umami 配置
      const { data } = await useFetch('/api/umami/config')
      const config = data.value?.data

      // 如果启用了 Umami 且配置完整
      if (config?.enableUmami && config?.scriptUrl && config?.websiteId) {
        const script = document.createElement('script')
        script.src = config.scriptUrl
        script.setAttribute('data-website-id', config.websiteId)
        script.async = true
        script.defer = true
        document.head.appendChild(script)
        console.log('✅ Umami 统计脚本已加载')
      }
    } catch (error) {
      console.error('❌ 加载 Umami 配置失败:', error)
    }
  }
})
