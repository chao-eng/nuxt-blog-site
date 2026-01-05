import { db, dbCommon } from './db'

/**
 * 初始化用户表
 */
export function initUserTable(): void {
  // 创建用户表
  const createUsersTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS admin_user (
      id INTEGER PRIMARY KEY,  -- 自增主键
      name TEXT NOT NULL, -- 昵称
      username TEXT UNIQUE NOT NULL, -- 用户名
      password TEXT NOT NULL, -- 密码
      email TEXT DEFAULT NULL, -- 邮箱
      avatar TEXT DEFAULT NULL, -- 头像
      bio TEXT DEFAULT NULL, -- 个人简介
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  createUsersTable.run()

  // 检查用户表是否为空
  const checkUserCount = db.prepare('SELECT COUNT(*) as count FROM admin_user')
  const result = checkUserCount.get() as { count: number }
  if (result.count === 0) {
    // 添加管理员用户
    const insertAdmin = db.prepare(`
      INSERT INTO admin_user (name, username, password, email, bio)
      VALUES (?, ?, ?, ?, ?)
    `)
    // 插入默认管理员数据
    insertAdmin.run(
      '系统管理员',
      'admin',
      'admin123',
      'admin@example.com',
      '默认管理员，建议登录后修改密码和个人信息'
    )

    console.log('⚠️ 检测到用户表为空，已自动创建默认管理员：')
    console.log('   用户名：admin')
    console.log('   初始密码：admin123')
  }
}

/**
 * 用户模块数据库操作
 */
export const dbUser = {
  /**
     * 根据用户名查询用户
     */
  getUserByUsername: (username: string) => {
    const sql = 'SELECT * FROM admin_user WHERE username = ?'
    return dbCommon.get(sql, [username])
  },

  /**
     * 根据用户 ID 查询用户
     */
  getUserById: (id: number) => {
    const sql = 'SELECT * FROM admin_user WHERE id = ?'
    return dbCommon.get(sql, [id])
  },

  /**
     * 更新用户信息
     */
  updateUser: (id: number, data: {
    name?: string
    email?: string
    avatar?: string
    bio?: string
    password?: string
  }) => {
    const updateFields: string[] = []
    const updateParams: any[] = []

    if (data.name !== undefined) {
      updateFields.push('name = ?')
      updateParams.push(data.name)
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?')
      updateParams.push(data.email)
    }
    if (data.avatar !== undefined) {
      updateFields.push('avatar = ?')
      updateParams.push(data.avatar)
    }
    if (data.bio !== undefined) {
      updateFields.push('bio = ?')
      updateParams.push(data.bio)
    }
    if (data.password !== undefined) {
      updateFields.push('password = ?')
      updateParams.push(data.password)
    }

    if (updateFields.length === 0) {
      throw new Error('没有需要更新的字段')
    }

    const sql = `UPDATE admin_user SET ${updateFields.join(', ')} WHERE id = ?`
    updateParams.push(id)
    return dbCommon.run(sql, updateParams)
  },

  /**
     * 创建新用户
     */
  createUser: (data: {
    name: string
    username: string
    password: string
    email?: string
    avatar?: string
    bio?: string
  }) => {
    const sql = `
      INSERT INTO admin_user (name, username, password, email, avatar, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    return dbCommon.run(sql, [
      data.name,
      data.username,
      data.password,
      data.email || null,
      data.avatar || null,
      data.bio || null
    ])
  }
}
