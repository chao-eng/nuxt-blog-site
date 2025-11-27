// server/utils/auth.ts
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import dbUtils from '../db'

interface JwtPayload {
  userId: number
  username: string
  [key: string]: unknown
}

export async function getServerUser(event: H3Event): Promise<JwtPayload | null> {
  const token = getCookie(event, 'auth.token')
    || getHeader(event, 'authorization')?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.authSecret) as JwtPayload
    // console.log("当前登录用户信息:",decoded)
    return decoded
  } catch {
    return null
  }
}

export async function requireServerAuth(event: H3Event) {
  const user = await getServerUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  return user
}

export async function getUserFromDatabase(event: H3Event) {
  const user = await getServerUser(event)

  if (!user) {
    return null
  }

  // 根据 token 中的用户 ID 从数据库获取完整信息

  return dbUtils.common.get('SELECT * FROM admin_user where id = ?', [user.userId])
}
