import jwt from 'jsonwebtoken'
import dbUtils from '../../db'

export default defineEventHandler(async (event) => {
  try {
    // 根据 token 中的信息获取用户数据
    const user = await getUserById(event.context.user.userId)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '用户不存在'
      })
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio
    }
  } catch (error: any) {
    console.error('服务器内部错误:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  }
})

async function getUserById(userId: number) {
  try {
    const users = dbUtils.common.all('SELECT * FROM admin_user WHERE id = ?', [userId])
    return users[0] || null
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return null
  }
}
