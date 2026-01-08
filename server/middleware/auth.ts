// server/middleware/auth.ts
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const url = event.node.req.url || ''
  const jwtSecret = config.authSecret

  if (!url.startsWith('/api')) {
    return
  }

  // 忽略查询参数
  const path = url.split('?')[0]

  // 检查排除路径
  const isExcluded = config.auth.excludedPaths.some((pattern: string) => {
    if (pattern.includes('*')) {
      const prefix = pattern.replace('*', '')
      return path.startsWith(prefix)
    }
    return path === pattern
  })

  if (isExcluded) {
    return
  }

  try {
    const token = getCookie(event, 'auth.token')
      || getHeader(event, 'authorization')?.replace('Bearer ', '')
    // console.log('url:',url)
    // console.log('token:',token)
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token required'
      })
    }

    // 验证 JWT token
    const payload = jwt.verify(token, jwtSecret) as { userId: number, username: string }

    // console.log('当前登录用户:', payload)
    // 将用户信息注入到 event context
    event.context.user = payload
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
})
