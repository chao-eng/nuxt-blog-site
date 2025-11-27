import dbUtils from '../../db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)

  // 这里实现你的用户验证逻辑
  // 例如：查询数据库验证用户
  const user = await validateUser(username, password)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '用户名或密码错误'
    })
  }

  const jwtSecret = useRuntimeConfig().authSecret

  // 生成 JWT token
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    jwtSecret,
    { expiresIn: '7d' }
  )

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }
  }
})

// 模拟用户验证函数
async function validateUser(username: string, password: string) {
  // 实际项目中这里应该查询数据库
  const users = dbUtils.common.all('SELECT * FROM admin_user where username = ?', [username])

  const user = users.find(u => u.username === username && u.password === password)
  console.log('用户登录,user:', user)
  return user || null
}
