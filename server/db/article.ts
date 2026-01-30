import type { Article, SaveArticleParams } from '~/types'
import { db, dbCommon } from './db'

/**
 * 初始化文章表
 */
export function initArticleTable(): void {
  // 创建文章表
  const createArticleTable = db.prepare(`
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
      -- MD 格式正文内容（允许为空，存储完整的 Markdown 内容）
      content TEXT,
      -- 修改时间：SQLite 支持 DATETIME 类型，自动存储时间戳
      modifyTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)
  createArticleTable.run()

  // 架构演进：添加 shortId 字段（如果不存在）
  try {
    console.log('📬 正在检查 articles 表架构更新...')
    const tableInfo = db.prepare("PRAGMA table_info(articles)").all() as any[]
    const hasShortId = tableInfo.some(col => col.name === 'shortId')

    if (!hasShortId) {
      console.log('📝 正在添加 shortId 字段...')
      db.prepare('ALTER TABLE articles ADD COLUMN shortId TEXT').run()
      console.log('✅ shortId 字段添加完成')
    }
  } catch (e: any) {
    console.error('❌ 数据库迁移阶段1失败:', e.message)
  }

  // 历史数据处理：为没有 shortId 的文章生成短 ID
  const articlesWithoutShortId = dbCommon.all<{ path: string }>('SELECT path FROM articles WHERE shortId IS NULL OR shortId = ""')
  if (articlesWithoutShortId.length > 0) {
    console.log(`正在为 ${articlesWithoutShortId.length} 篇文章补全 shortId...`)
    const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase()
    const updateStmt = db.prepare('UPDATE articles SET shortId = ? WHERE path = ?')

    // 使用事务提高效率
    const transaction = db.transaction((articles) => {
      for (const art of articles) {
        let sid = generateShortId()
        // 简单冲突检查（小规模数据够用）
        updateStmt.run(sid, art.path)
      }
    })
    transaction(articlesWithoutShortId)
    console.log('✅ 历史数据 shortId 补全完成')
  }

  // 最后创建唯一索引
  try {
    console.log('📇 正在检查并创建 shortId 索引...')
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_shortId ON articles(shortId)').run()
    console.log('✅ shortId 索引创建/检查完成')
  } catch (e: any) {
    console.error('❌ 创建索引失败:', e.message)
  }
}

/**
 * 文章模块数据库操作
 */
export const dbArticle = {
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
    const existingArticle = dbCommon.get<Article>('SELECT path, shortId FROM articles WHERE path = ?', [path])
    const isEditMode = !!existingArticle

    const tagsStr = JSON.stringify(tags || [])
    const shortId = params.shortId || (existingArticle?.shortId) || Math.random().toString(36).substring(2, 8).toUpperCase()
    // 转换为 1/0
    let publishedVal = 0
    const pub = params.published
    if (pub) {
      publishedVal = 1
    }
    const isStickyVal = params.isSticky ? 1 : 0
    const dateStr = typeof rest.date === 'object' ? (rest.date as Date).toISOString() : (rest.date as string)

    // 3. 新增模式：校验核心字段 + 执行插入
    if (!isEditMode) {
      const { title, date, published } = params
      // 核心字段校验：published 可能是布尔值 false（草稿），所以不能用 !published 直接判断
      if (title === undefined || title === null || title === '' ||
        date === undefined || date === null || date === '' ||
        published === undefined || published === null) {
        throw new Error('新增文章必须传入 标题、创建时间、发布状态等核心字段')
      }
      const sql = `
        INSERT INTO articles (path, title, date, description, image, tags, published, userid, isSticky, content, shortId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      return dbCommon.run(sql, [
        path,
        title,
        dateStr,
        rest.description || null,
        rest.image || null,
        tagsStr,
        publishedVal,
        rest.userid,
        isStickyVal,
        rest.content || null,
        shortId
      ])
    }

    // 4. 编辑模式：构建更新字段 + 执行更新
    const updateFields: string[] = []
    const updateParams: (string | number | boolean | null)[] = []

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
    if (rest.content !== undefined) {
      updateFields.push('content = ?')
      updateParams.push(rest.content)
    }
    if (params.shortId !== undefined) {
      updateFields.push('shortId = ?')
      updateParams.push(params.shortId)
    }

    // 强制更新修改时间
    updateFields.push('modifyTime = CURRENT_TIMESTAMP')

    if (updateFields.length === 1) { // 仅修改时间，无其他字段
      throw new Error('没有需要更新的字段')
    }

    const sql = `UPDATE articles SET ${updateFields.join(', ')} WHERE path = ?`
    updateParams.push(path) // 拼接 path 条件
    return dbCommon.run(sql, updateParams)
  },

  /**
   * 根据短 ID 查询文章路径
   * @param shortId 短 ID
   * @returns 文章对象或 null
   */
  getArticleByShortId: (shortId: string): Article | null => {
    if (!shortId) return null
    const sql = 'SELECT * FROM articles WHERE UPPER(shortId) = UPPER(?)'
    const rawArticle = dbCommon.get<Omit<Article, 'tags'> & { tags: string }>(sql, [shortId])

    if (!rawArticle) return null

    // 解析 tags 字段
    let tags: string[] = []
    try {
      tags = rawArticle.tags ? JSON.parse(rawArticle.tags) : []
      if (!Array.isArray(tags)) tags = []
    } catch (e) {
      console.warn(`解析文章tags失败（shortId: ${shortId}）:`, e)
      tags = []
    }

    return {
      ...rawArticle,
      tags,
      isSticky: !!rawArticle.isSticky,
      published: !!rawArticle.published,
      isSaved: true,
      author: '',
      avatar: '',
      newBlog: false
    } as Article
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
    return dbCommon.run(sql, [path])
  },

  /**
     * 删除所有文章（用于重建索引）
     */
  deleteAllArticles: () => {
    const sql = 'DELETE FROM articles'
    return dbCommon.run(sql)
  },

  /**
     * 查询已保存的所有文章目录
     */
  getAllArticlePaths: () => {
    const sql = 'SELECT path FROM articles'
    return dbCommon.all<{ path: string }>(sql)
  },

  /**
     * 根据路径查询单篇文章的完整信息
     * @param path 文章路径
     * @returns 文章对象或 null
     */
  getArticleByPath: (path: string): Article | null => {
    if (!path) return null
    const sql = 'SELECT * FROM articles WHERE path = ?'
    const rawArticle = dbCommon.get<Omit<Article, 'tags'> & { tags: string }>(sql, [path])

    if (!rawArticle) return null

    // 解析 tags 字段
    let tags: string[] = []
    try {
      tags = rawArticle.tags ? JSON.parse(rawArticle.tags) : []
      if (!Array.isArray(tags)) tags = []
    } catch (e) {
      console.warn(`解析文章tags失败（path: ${path}）:`, e)
      tags = []
    }

    return {
      ...rawArticle,
      tags,
      isSticky: !!rawArticle.isSticky,
      published: !!rawArticle.published,
      isSaved: true,
      author: '',
      avatar: '',
      newBlog: false
    } as Article
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
    isSticky,
    published
  }: {
    page?: number
    pageSize?: number
    sortBy?: keyof Article
    sortOrder?: 'asc' | 'desc'
    search?: string
    tag?: string
    isSticky?: boolean
    published?: number | boolean | null
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
    let whereClause = '1=1' // 默认允许所有
    const queryParams: (string | number | boolean | null)[] = []

    // 如果未传 published 参数，默认查询已发布文章(1)，保证前端组件逻辑不变
    // 如果传了 null 或 undefined 的特殊处理逻辑（此处我们约定 undefined 代表默认，null 或显式布尔代表想要的结果）
    if (published !== undefined) {
      if (published !== null) {
        whereClause += ' AND t.published = ?'
        queryParams.push(published ? 1 : 0)
      }
      // 如果传了 null，则不加该条件，代表查询所有
    } else {
      whereClause += ' AND t.published = 1'
    }

    if (search) {
      whereClause += ' AND (t.title LIKE ? OR t.description LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    if (tag) {
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
      ORDER BY t.isSticky DESC, ${validSortBy} ${validSortOrder}, path ${validSortOrder} 
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

    const rawList = dbCommon.all<Omit<Article, 'tags'> & { tags: string }>(dataSql, listParams)
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
    const totalResult = dbCommon.get<{ total: number }>(countSql, countParams)
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
    const rawTagsList = dbCommon.all<{ tags: string }>(sql)

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
      const author = dbCommon.get<{ name: string, avatar: string | null }>(sql, [path])

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

    const prev = dbCommon.get<{ title: string, path: string }>(prevSql, [date, date, path]) || null
    const next = dbCommon.get<{ title: string, path: string }>(nextSql, [date, date, path]) || null

    return { prev, next }
  }
}
