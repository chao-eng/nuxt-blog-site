// plugins/auth-interceptor.client.ts
export default defineNuxtPlugin(() => {
  // 定义错误响应接口
  interface ErrorResponse {
    response: {
      status: number
      statusText: string
      _data?: any
    }
    request?: string
  }

  // 全局 401 错误处理函数
  const handleUnauthorized = (): void => {
    // 清除认证状态
    const token = useCookie<string | null>('auth.token')
    token.value = null

    // 跳转登录页
    navigateTo('/admin/login')

    // 显示提示（如果使用 Nuxt UI）
    const toast = useToast()
    toast.add({
      title: '认证失效',
      description: '请重新登录',
      color: 'error',
      duration: 5000
    })
  }

  // 创建自定义 fetch 实例
  globalThis.$fetch = $fetch.create({
    onResponseError(context) {
      const { response, request } = context
      console.error(`请求错误 [${response.status}]:`, request)

      if (response.status === 401) {
        // console.log('检测到 401 未授权错误');
        handleUnauthorized()
      }
    }
  })
})
