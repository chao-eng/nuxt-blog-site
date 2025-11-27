import type { Statement } from 'better-sqlite3'
import Database from 'better-sqlite3'
import type { Article, SaveArticleParams } from '~/types'
import { join } from 'path'

// 确定数据库文件路径（项目根目录下的 data 文件夹）
const dbPath = join(useRuntimeConfig().dbPath) // 数据库文件路径：项目根目录/data/db.sqlite

// 创建数据库连接（单例模式，避免重复创建连接）
const db: Database.Database = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined // 开发环境打印 SQL 日志
})

/**
 * 初始化数据库（创建表，首次运行时执行）
 */
function initDB(): void {
  // 创建用户表
  const createUsersTable: Statement = db.prepare(`
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
            INSERT INTO admin_user (name, username, password,email,bio)
            VALUES (?, ?, ?,?,?)
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
  // 创建文章表
  const createArticleTable: Statement = db.prepare(`
        CREATE TABLE IF NOT EXISTS articles (
            -- 路径作为主键（唯一标识文章，避免重复）
            path TEXT PRIMARY KEY NOT NULL UNIQUE,
            -- 文章标题（非空，确保每篇文章有标题）
            title TEXT NOT NULL,
            -- 创建时间（存储字符串格式，如 "2025-11-13" 或 "2025-11-13 14:30:00"）
            date TEXT NOT NULL,
            -- 文章描述（允许为空，短文本）
            description TEXT,
            -- 文章图片路径（允许为空）
            image TEXT,
            -- 标签：SQLite 无原生数组，存储为 JSON 字符串（如 '["mysql","float"]'）
            tags TEXT NOT NULL DEFAULT '[]',
            -- 是否发布：1 为发布，0 为草稿
            published INTEGER NOT NULL DEFAULT 0,
            -- 发布用户
            userid INTEGER NOT NULL,
            -- 是否首页置顶：1 为置顶 0为不指定
             isSticky INTEGER DEFAULT 0,
            -- 修改时间：SQLite 支持 DATETIME 类型，自动存储时间戳
            modifyTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `)
  createArticleTable.run()

  // 创建旅行记录表
  const createTravelRecordsTable: Statement = db.prepare(`
    CREATE TABLE IF NOT EXISTS travel_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      visible INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  createTravelRecordsTable.run()

  // 检查是否已有旅行记录，如果没有则插入示例数据
  const checkTravelRecords = db.prepare('SELECT COUNT(*) as count FROM travel_records')
  const travelResult = checkTravelRecords.get() as { count: number }
  if (travelResult.count === 0) {
    const insertTravelRecords = db.prepare(`
      INSERT INTO travel_records (data) VALUES (?)
    `)
    const sampleData = JSON.stringify([
      {
        name: '北京',
        value: [116.4074, 39.9042],
        time: '2024年3月',
        description: '游览了故宫、长城等著名景点',
        photos: [],
        articleLink: ''
      },
      {
        name: '上海',
        value: [121.4737, 31.2304],
        time: '2024年5月',
        description: '体验了外滩夜景和迪士尼乐园',
        photos: [],
        articleLink: ''
      },
      {
        name: '成都',
        value: [104.0668, 30.5728],
        time: '2024年7月',
        description: '品尝了地道的川菜和火锅',
        photos: [],
        articleLink: ''
      },
      {
        name: '杭州',
        value: [120.1551, 30.2741],
        time: '2024年9月',
        description: '欣赏了西湖美景',
        photos: [],
        articleLink: ''
      },
      {
        name: '西安',
        value: [108.9398, 34.3416],
        time: '2024年10月',
        description: '参观了兵马俑和古城墙',
        photos: [],
        articleLink: ''
      }
    ])
    insertTravelRecords.run(sampleData)
    console.log('✅ 已创建旅行记录表并插入示例数据')
  }
  // 创建评论配置表
  const createCommentConfigTable: Statement = db.prepare(`
    CREATE TABLE IF NOT EXISTS comment_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enable_comments INTEGER DEFAULT 0,
      repo TEXT DEFAULT '',
      repo_id TEXT DEFAULT '',
      category TEXT DEFAULT '',
      category_id TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  createCommentConfigTable.run()

  // 检查是否已有配置，如果没有则插入默认记录
  const checkCommentConfig = db.prepare('SELECT COUNT(*) as count FROM comment_config')
  const commentConfigResult = checkCommentConfig.get() as { count: number }
  if (commentConfigResult.count === 0) {
    const insertCommentConfig = db.prepare(`
      INSERT INTO comment_config (enable_comments, repo, repo_id, category, category_id)
      VALUES (0, '', '', '', '')
    `)
    insertCommentConfig.run()
    console.log('✅ 已创建 comment_config 表并插入默认配置')
  }

  // 创建 Umami 配置表
  const createUmamiConfigTable: Statement = db.prepare(`
    CREATE TABLE IF NOT EXISTS umami_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enable_umami INTEGER DEFAULT 0,
      script_url TEXT DEFAULT '',
      website_id TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  createUmamiConfigTable.run()

  // 检查是否已有配置，如果没有则插入默认记录
  const checkUmamiConfig = db.prepare('SELECT COUNT(*) as count FROM umami_config')
  const umamiConfigResult = checkUmamiConfig.get() as { count: number }
  if (umamiConfigResult.count === 0) {
    const insertUmamiConfig = db.prepare(`
      INSERT INTO umami_config (enable_umami, script_url, website_id)
      VALUES (0, '', '')
    `)
    insertUmamiConfig.run()
    console.log('✅ 已创建 umami_config 表并插入默认配置')
  }

}

// 执行初始化
initDB()

/**
 * 数据库操作工具类
 * 封装常用的查询、插入、更新等方法，并添加类型约束
 */
const dbUtils = {
  common: {
    /**
         * 查询单条数据
         * @param sql SQL 语句
         * @param params 查询参数（数组或对象）
         * @returns 单条数据对象（或 undefined）
         */
    get: <T = Record<string, any>>(sql: string, params?: any[] | object): T | undefined => {
      const statement: Statement = db.prepare(sql)
      return params === undefined ? statement.get() as T | undefined : statement.get(params) as T | undefined
    },

    /**
         * 查询多条数据
         * @param sql SQL 语句
         * @param params 查询参数（数组或对象）
         * @returns 数据对象数组
         */
    all: <T = Record<string, any>>(sql: string, params?: any[] | object): T[] => {
      const statement: Statement = db.prepare(sql)
      // 关键：如果没有 params，直接调用 all() 而非 all(undefined)
      return params === undefined ? statement.all() as T[] : statement.all(params) as T[]
    },

    /**
         * 执行插入/更新/删除操作
         * @param sql SQL 语句
         * @param params 操作参数（数组或对象）
         * @returns 操作结果（包含 changes、lastInsertRowid 等）
         */
    run: (sql: string, params?: any[] | object): Database.RunResult => {
      const statement: Statement = db.prepare(sql)
      return params === undefined ? statement.run() : statement.run(params)
    },

    /**
         * 获取最后插入的记录 ID
         * @returns 最后插入的 ID（数字）
         */
    lastInsertRowid: (): number | bigint => {
      // better-sqlite3 的 Database 实例没有直接暴露 lastInsertRowid，通常是在 RunResult 中获取
      // 但这里似乎是想获取全局的最后插入ID，这在 better-sqlite3 中可能需要通过 SQL 获取
      // 或者修改逻辑，让 run 方法返回 lastInsertRowid
      const result = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number | bigint }
      return result.id
    }
  },
  article: {
    /**
         * 保存文章（自动判断新增/编辑）
         * @param params 文章参数（path 为唯一标识）
         * - 若 path 不存在：执行新增（需传入 title/date/content 核心字段）
         * - 若 path 已存在：执行编辑（传入需要更新的字段即可）
         * @returns 操作结果
         */
    saveArticle: (params: SaveArticleParams) => {
      console.log('保存文章参数：', params)
      const { path, tags, ...rest } = params
      if (!path) throw new Error('文章路径（path）不能为空')

      // 1. 检查 path 是否已存在（判断新增/编辑）
      const existingArticle = dbUtils.common.get<Article>('SELECT path FROM articles WHERE path = ?', [path])
      const isEditMode = !!existingArticle

      const tagsStr = JSON.stringify(tags || [])
      // 转换为 1/0
      let publishedVal = 0
      const pub = params.published as any
      if (pub === true || pub === 'true' || pub == 1) {
        publishedVal = 1
      }
      const isStickyVal = params.isSticky ? 1 : 0
      const dateStr = typeof rest.date === 'object' ? (rest.date as Date).toISOString() : (rest.date as string)

      // 3. 新增模式：校验核心字段 + 执行插入
      if (!isEditMode) {
        const { title, date, published } = params
        if (!title || !date || !published) {
          throw new Error('新增文章必须传入 标题、创建时间 、发布状态等 核心字段')
        }
        const sql = `
                    INSERT INTO articles (path, title, date, description, image, tags, published,userid, isSticky)
                    VALUES (?, ?, ?, ?, ?, ?, ?,?, ?)
                  `
        return dbUtils.common.run(sql, [
          path,
          title,
          dateStr,
          rest.description || null,
          rest.image || null,
          tagsStr,
          publishedVal,
          rest.userid,
          isStickyVal
        ])
      }

      // 4. 编辑模式：构建更新字段 + 执行更新
      const updateFields: string[] = []
      const updateParams: any[] = []

      if (rest.title !== undefined) {
        updateFields.push('title = ?')
        updateParams.push(rest.title)
      }
      if (rest.date !== undefined) {
        updateFields.push('date = ?')
        updateParams.push(dateStr)
      }
      if (rest.description !== undefined) {
        updateFields.push('description = ?')
        updateParams.push(rest.description)
      }
      if (rest.image !== undefined) {
        updateFields.push('image = ?')
        updateParams.push(rest.image)
      }
      if (tags !== undefined) {
        updateFields.push('tags = ?')
        updateParams.push(tagsStr)
      }
      if (rest.published !== undefined) {
        updateFields.push('published = ?')
        updateParams.push(publishedVal)
      }
      if (rest.isSticky !== undefined) {
        updateFields.push('isSticky = ?')
        updateParams.push(isStickyVal)
      }

      // 强制更新修改时间
      updateFields.push('modifyTime = CURRENT_TIMESTAMP')

      if (updateFields.length === 1) { // 仅修改时间，无其他字段
        throw new Error('没有需要更新的字段')
      }

      const sql = `UPDATE articles SET ${updateFields.join(', ')} WHERE path = ?`
      updateParams.push(path) // 拼接 path 条件
      return dbUtils.common.run(sql, updateParams)
    },
    /**
         * 根据路径删除文章
         * @param path 文章路径（主键）
         * @returns 操作结果（changes 为 1 表示删除成功，0 表示文章不存在）
         */
    deleteArticleByPath: (path: string) => {
      console.log('删除文章参数：', path)
      if (!path) throw new Error('文章路径（path）不能为空')
      const sql = 'DELETE FROM articles WHERE path = ?'
      return dbUtils.common.run(sql, [path])
    },
    /**
     * 删除所有文章（用于重建索引）
     */
    deleteAllArticles: () => {
      const sql = 'DELETE FROM articles'
      return dbUtils.common.run(sql)
    },
    /**
         * 查询已保存的所有文章目录
         */
    getAllArticlePaths: () => {
      const sql = 'SELECT path FROM articles'
      return dbUtils.common.all<{ path: string }>(sql)
    },

    /**
         * 获取文章列表（支持分页、排序，并处理tags字段解析）
         * @param page 页码（默认1）
         * @param pageSize 每页条数（默认10）
         * @param sortBy 排序字段（默认date）
         * @param sortOrder 排序方向（默认desc）
         * @returns { list: Article[], total: number } 文章集合和总条数
         */
    getArticles: ({
      page = 1,
      pageSize = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      search = '',
      tag = '',
      isSticky
    }: {
      page?: number
      pageSize?: number
      sortBy?: keyof Article
      sortOrder?: 'asc' | 'desc'
      search?: string
      tag?: string
      isSticky?: boolean
    }): { list: Article[], total: number } => {
      // 1. 参数校验与修正
      const validPage = Math.max(1, Math.floor(Number(page) || 1))
      const validPageSize = Math.max(1, Math.min(100, Math.floor(Number(pageSize) || 10)))
      const offset = (validPage - 1) * validPageSize

      // 2. 排序字段白名单校验（防注入）
      const allowedSortFields: (keyof Article)[] = ['path', 'title', 'date', 'modifyTime', 'published']
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'date'
      const validSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc'

      // 3. 构建查询条件
      let whereClause = "t.published = 1"
      const queryParams: any[] = []

      if (search) {
        whereClause += ' AND (t.title LIKE ? OR t.description LIKE ?)'
        queryParams.push(`%${search}%`, `%${search}%`)
      }

      if (tag) {
        // 简单实现：tags 存储为 JSON 数组字符串，如 '["tag1","tag2"]'
        // 使用 LIKE '%"tag"%' 来匹配
        whereClause += ' AND t.tags LIKE ?'
        queryParams.push(`%"${tag}"%`)
      }

      if (isSticky !== undefined) {
        whereClause += ' AND t.isSticky = ?'
        queryParams.push(isSticky ? 1 : 0)
      }

      // 4. 构建查询SQL
      const dataSql = `
                SELECT t.* 
                FROM articles t
                WHERE ${whereClause}
                ORDER BY ${validSortBy} ${validSortOrder}, path ${validSortOrder} 
                LIMIT ? OFFSET ?
              `
      const countSql = `
                SELECT COUNT(*) as total 
                FROM articles t
                WHERE ${whereClause}
            `

      // 5. 执行查询并处理结果
      const listParams = [...queryParams, validPageSize, offset]
      const countParams = [...queryParams]

      const rawList = dbUtils.common.all<Omit<Article, 'tags'> & { tags: string }>(dataSql, listParams)
      // 解析tags字段（从JSON字符串转为数组，兼容解析失败的情况）
      const list = rawList.map((article) => {
        let tags: string[] = []
        try {
          tags = article.tags ? JSON.parse(article.tags) : []
          // 确保解析后是数组（防止非法数据）
          if (!Array.isArray(tags)) tags = []
        } catch (e) {
          console.warn(`解析文章tags失败（path: ${article.path}）:`, e)
          tags = []
        }
        return { ...article, tags, isSticky: !!article.isSticky, published: !!article.published } as Article
      })

      // 6. 获取总条数
      const totalResult = dbUtils.common.get<{ total: number }>(countSql, countParams)
      const total = totalResult?.total || 0

      return { list, total }
    },
    /**
         * 获取所有标签及其出现次数（仅统计已发布文章）
         * @returns 标签数组，每个元素包含标签名和出现次数 { tag: string; count: number }[]
         */
    getTagsWithCount: (): { tag: string, count: number }[] => {
      // 1. 查询所有已发布文章的 tags 字段（仅需要 tags 字段，减少数据传输）
      const sql = 'SELECT tags FROM articles WHERE published = 1'
      const rawTagsList = dbUtils.common.all<{ tags: string }>(sql)

      // 2. 初始化计数器（键为标签名，值为出现次数）
      const tagCounter: Record<string, number> = {}

      // 3. 遍历所有文章的 tags，解析并统计
      rawTagsList.forEach((item) => {
        try {
          // 解析 JSON 字符串为标签数组（容错：空字符串或无效 JSON 会被捕获）
          const tags: string[] = item.tags ? JSON.parse(item.tags) : []
          if (!Array.isArray(tags)) return // 确保是数组，防止非法数据

          // 累加每个标签的出现次数
          tags.forEach((tag) => {
            const trimmedTag = tag.trim() // 去除前后空格，避免重复统计（如 "js" 和 " js "）
            if (trimmedTag) { // 跳过空标签
              tagCounter[trimmedTag] = (tagCounter[trimmedTag] || 0) + 1
            }
          })
        } catch (e) {
          console.warn('解析文章标签失败（无效JSON）:', e)
        }
      })

      // 4. 转换为数组并按出现次数降序排序（方便前端展示）
      return Object.entries(tagCounter)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count) // 从多到少排序
    },

    /**
         * 根据文章路径（path）查询作者信息（姓名 + 头像）
         * @param path 文章路径（主键，必填）
         * @returns 作者信息 { name: string; avatar: string | null }，无匹配时返回默认值
         */
    queryAuthor: (path: string): { name: string, avatar: string | null } => {
      // 1. 参数校验：path 不能为空
      if (!path) {
        console.warn('查询作者失败：文章路径（path）不能为空')
        return { name: '未知作者', avatar: null }
      }

      try {
        // 2. SQL 关联查询：通过文章 path 查 userid，再关联 admin_user 表拿 name 和 avatar
        const sql = `
            SELECT u.name, u.avatar 
            FROM articles t
            LEFT JOIN admin_user u ON t.userid = u.id
            WHERE t.path = ?
            LIMIT 1
        `

        // 3. 执行查询（LEFT JOIN 确保即使 userid 无效也能返回结果）
        const author = dbUtils.common.get<{ name: string, avatar: string | null }>(sql, [path])

        // 4. 空值兜底：无匹配作者时返回默认信息
        return {
          name: author?.name || '未知作者',
          avatar: author?.avatar || null // 头像为空时返回 null，前端可自行处理默认图
        }
      } catch (e) {
        // 5. 异常捕获：避免查询失败导致程序崩溃
        console.error(`查询文章作者失败（path: ${path}）:`, e)
        return { name: '未知作者', avatar: null }
      }
    },
    /**
     * 获取相邻文章（上一篇和下一篇）
     * @param date 当前文章日期
     * @param path 当前文章路径
     * @returns { prev: { title: string, path: string } | null, next: { title: string, path: string } | null }
     */
    getAdjacentArticles: (date: string, path: string): { prev: { title: string, path: string } | null, next: { title: string, path: string } | null } => {
      // 上一篇 (Newer): date > currentDate OR (date = currentDate AND path > currentPath)
      // 在降序列表中，位于当前文章上方的是更新的文章
      const prevSql = `
            SELECT title, path FROM articles 
            WHERE published = 1 
            AND (date > ? OR (date = ? AND path > ?))
            ORDER BY date ASC, path ASC 
            LIMIT 1
        `

      // 下一篇 (Older): date < currentDate OR (date = currentDate AND path < currentPath)
      // 在降序列表中，位于当前文章下方的是更旧的文章
      const nextSql = `
            SELECT title, path FROM articles 
            WHERE published = 1 
            AND (date < ? OR (date = ? AND path < ?))
            ORDER BY date DESC, path DESC 
            LIMIT 1
        `

      const prev = dbUtils.common.get<{ title: string, path: string }>(prevSql, [date, date, path]) || null
      const next = dbUtils.common.get<{ title: string, path: string }>(nextSql, [date, date, path]) || null

      return { prev, next }
    }
  },
  travelRecords: {
    /**
     * 获取旅行记录数据
     * @returns 旅行记录对象，包含 data 和 visible
     */
    getTravelRecords: (): { data: string, visible: boolean } => {
      const sql = 'SELECT data, visible FROM travel_records ORDER BY id DESC LIMIT 1'
      const result = dbUtils.common.get<{ data: string, visible: number }>(sql)
      return {
        data: result?.data || '[]',
        visible: result?.visible === 1
      }
    },

    /**
     * 保存旅行记录数据
     * @param data JSON 字符串格式的旅行记录数据
     * @param visible 是否在首页显示
     * @returns 操作结果
     */
    saveTravelRecords: (data: string, visible: boolean = true) => {
      // 验证 JSON 格式
      try {
        JSON.parse(data)
      } catch (e) {
        throw new Error('Invalid JSON format')
      }

      // 检查是否已有记录
      const existingRecord = dbUtils.common.get<{ id: number }>('SELECT id FROM travel_records LIMIT 1')

      const visibleValue = visible ? 1 : 0

      if (existingRecord) {
        // 更新现有记录
        const sql = 'UPDATE travel_records SET data = ?, visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        return dbUtils.common.run(sql, [data, visibleValue, existingRecord.id])
      } else {
        // 插入新记录
        const sql = 'INSERT INTO travel_records (data, visible) VALUES (?, ?)'
        return dbUtils.common.run(sql, [data, visibleValue])
      }
    }
  },
  commentConfig: {
    /**
     * 获取评论配置
     */
    getConfig: () => {
      const sql = 'SELECT * FROM comment_config LIMIT 1'
      const result = dbUtils.common.get<any>(sql)
      if (!result) return null
      return {
        enableComments: result.enable_comments === 1,
        repo: result.repo,
        repoId: result.repo_id,
        category: result.category,
        categoryId: result.category_id
      }
    },

    /**
     * 保存评论配置
     */
    saveConfig: (config: { enableComments: boolean, repo: string, repoId: string, category: string, categoryId: string }) => {
      const existingConfig = dbUtils.common.get<{ id: number }>('SELECT id FROM comment_config LIMIT 1')

      const enableValue = config.enableComments ? 1 : 0

      if (existingConfig) {
        const sql = `
          UPDATE comment_config 
          SET enable_comments = ?, repo = ?, repo_id = ?, category = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `
        return dbUtils.common.run(sql, [enableValue, config.repo, config.repoId, config.category, config.categoryId, existingConfig.id])
      } else {
        const sql = `
          INSERT INTO comment_config (enable_comments, repo, repo_id, category, category_id)
          VALUES (?, ?, ?, ?, ?)
        `
        return dbUtils.common.run(sql, [enableValue, config.repo, config.repoId, config.category, config.categoryId])
      }
    }
  },
  umamiConfig: {
    /**
     * 获取 Umami 配置
     */
    getConfig: () => {
      const sql = 'SELECT * FROM umami_config LIMIT 1'
      const result = dbUtils.common.get<any>(sql)
      if (!result) return null
      return {
        enableUmami: result.enable_umami === 1,
        scriptUrl: result.script_url,
        websiteId: result.website_id
      }
    },

    /**
     * 保存 Umami 配置
     */
    saveConfig: (config: { enableUmami: boolean, scriptUrl: string, websiteId: string }) => {
      const existingConfig = dbUtils.common.get<{ id: number }>('SELECT id FROM umami_config LIMIT 1')

      const enableValue = config.enableUmami ? 1 : 0

      if (existingConfig) {
        const sql = `
          UPDATE umami_config 
          SET enable_umami = ?, script_url = ?, website_id = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `
        return dbUtils.common.run(sql, [enableValue, config.scriptUrl, config.websiteId, existingConfig.id])
      } else {
        const sql = `
          INSERT INTO umami_config (enable_umami, script_url, website_id)
          VALUES (?, ?, ?)
        `
        return dbUtils.common.run(sql, [enableValue, config.scriptUrl, config.websiteId])
      }
    }
  }
}

export default dbUtils
