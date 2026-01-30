import { db, dbCommon } from './db'

/**
 * 初始化设置相关表
 */
export function initSettingsTables(): void {
  // 创建评论配置表
  const createCommentConfigTable = db.prepare(`
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
  const createUmamiConfigTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS umami_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enable_umami INTEGER DEFAULT 0,
      script_url TEXT DEFAULT '',
      website_id TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  createUmamiConfigTable.run()

  // 检查是否已有 share_url 列（用于迁移）
  const umamiTableInfo = db.prepare("PRAGMA table_info('umami_config')").all() as any[]
  const hasShareUrl = umamiTableInfo.some(col => col.name === 'share_url')
  if (!hasShareUrl) {
    console.log('⚠️ umami_config 表缺少 share_url 列，正在添加...')
    db.prepare("ALTER TABLE umami_config ADD COLUMN share_url TEXT DEFAULT ''").run()
    console.log('✅ 已添加 share_url 列')
  }

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

  // 创建 S3 配置表
  const createS3ConfigTable = db.prepare(`
    CREATE TABLE IF NOT EXISTS s3_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enable_s3 INTEGER DEFAULT 0,
      access_key_id TEXT DEFAULT '',
      secret_access_key TEXT DEFAULT '',
      region TEXT DEFAULT '',
      bucket TEXT DEFAULT '',
      endpoint TEXT DEFAULT '',
      public_url TEXT DEFAULT '',
      path TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
  createS3ConfigTable.run()

  // 检查是否已有 path 列（用于迁移）
  const s3TableInfo = db.prepare("PRAGMA table_info('s3_config')").all() as any[]
  const hasS3Path = s3TableInfo.some(col => col.name === 'path')
  if (!hasS3Path) {
    console.log('⚠️ s3_config 表缺少 path 列，正在添加...')
    db.prepare("ALTER TABLE s3_config ADD COLUMN path TEXT DEFAULT ''").run()
    console.log('✅ 已添加 path 列')
  }

  // 检查是否已有配置，如果没有则插入默认记录
  const checkS3Config = db.prepare('SELECT COUNT(*) as count FROM s3_config')
  const s3ConfigResult = checkS3Config.get() as { count: number }
  if (s3ConfigResult.count === 0) {
    const insertS3Config = db.prepare(`
      INSERT INTO s3_config (enable_s3, access_key_id, secret_access_key, region, bucket, endpoint, public_url, path)
      VALUES (0, '', '', '', '', '', '', '')
    `)
    insertS3Config.run()
    console.log('✅ 已创建 s3_config 表并插入默认配置')
  }
}

/**
 * 评论配置数据库操作
 */
export const dbCommentConfig = {
  /**
     * 获取评论配置
     */
  getConfig: () => {
    const sql = 'SELECT * FROM comment_config LIMIT 1'
    const result = dbCommon.get<{
      enable_comments: number
      repo: string
      repo_id: string
      category: string
      category_id: string
    }>(sql)
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
    const existingConfig = dbCommon.get<{ id: number }>('SELECT id FROM comment_config LIMIT 1')

    const enableValue = config.enableComments ? 1 : 0

    if (existingConfig) {
      const sql = `
        UPDATE comment_config 
        SET enable_comments = ?, repo = ?, repo_id = ?, category = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `
      return dbCommon.run(sql, [enableValue, config.repo, config.repoId, config.category, config.categoryId, existingConfig.id])
    } else {
      const sql = `
        INSERT INTO comment_config (enable_comments, repo, repo_id, category, category_id)
        VALUES (?, ?, ?, ?, ?)
      `
      return dbCommon.run(sql, [enableValue, config.repo, config.repoId, config.category, config.categoryId])
    }
  }
}

/**
 * Umami 配置数据库操作
 */
export const dbUmamiConfig = {
  /**
     * 获取 Umami 配置
     */
  getConfig: () => {
    const sql = 'SELECT * FROM umami_config LIMIT 1'
    const result = dbCommon.get<{
      enable_umami: number
      script_url: string
      website_id: string
      share_url: string
    }>(sql)
    if (!result) return null
    return {
      enableUmami: result.enable_umami === 1,
      scriptUrl: result.script_url,
      websiteId: result.website_id,
      shareUrl: result.share_url || ''
    }
  },

  /**
     * 保存 Umami 配置
     */
  saveConfig: (config: { enableUmami: boolean, scriptUrl: string, websiteId: string, shareUrl?: string }) => {
    const existingConfig = dbCommon.get<{ id: number }>('SELECT id FROM umami_config LIMIT 1')

    const enableValue = config.enableUmami ? 1 : 0
    const shareUrl = config.shareUrl || ''

    if (existingConfig) {
      const sql = `
        UPDATE umami_config 
        SET enable_umami = ?, script_url = ?, website_id = ?, share_url = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `
      return dbCommon.run(sql, [enableValue, config.scriptUrl, config.websiteId, shareUrl, existingConfig.id])
    } else {
      const sql = `
        INSERT INTO umami_config (enable_umami, script_url, website_id, share_url)
        VALUES (?, ?, ?, ?)
      `
      return dbCommon.run(sql, [enableValue, config.scriptUrl, config.websiteId, shareUrl])
    }
  }
}

/**
 * S3 配置数据库操作
 */
export const dbS3Config = {
  /**
     * 获取 S3 配置
     */
  getConfig: () => {
    const sql = 'SELECT * FROM s3_config LIMIT 1'
    const result = dbCommon.get<{
      enable_s3: number
      access_key_id: string
      secret_access_key: string
      region: string
      bucket: string
      endpoint: string
      public_url: string
      path: string
    }>(sql)
    if (!result) return null
    return {
      enableS3: result.enable_s3 === 1,
      accessKeyId: result.access_key_id,
      secretAccessKey: result.secret_access_key,
      region: result.region,
      bucket: result.bucket,
      endpoint: result.endpoint,
      publicUrl: result.public_url,
      path: result.path || ''
    }
  },

  /**
     * 保存 S3 配置
     */
  saveConfig: (config: {
    enableS3: boolean
    accessKeyId: string
    secretAccessKey: string
    region: string
    bucket: string
    endpoint: string
    publicUrl: string
    path: string
  }) => {
    const existingConfig = dbCommon.get<{ id: number }>('SELECT id FROM s3_config LIMIT 1')
    const enableValue = config.enableS3 ? 1 : 0

    if (existingConfig) {
      const sql = `
        UPDATE s3_config 
        SET enable_s3 = ?, access_key_id = ?, secret_access_key = ?, region = ?, bucket = ?, endpoint = ?, public_url = ?, path = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `
      return dbCommon.run(sql, [
        enableValue,
        config.accessKeyId,
        config.secretAccessKey,
        config.region,
        config.bucket,
        config.endpoint,
        config.publicUrl,
        config.path || '',
        existingConfig.id
      ])
    } else {
      const sql = `
        INSERT INTO s3_config (enable_s3, access_key_id, secret_access_key, region, bucket, endpoint, public_url, path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
      return dbCommon.run(sql, [
        enableValue,
        config.accessKeyId,
        config.secretAccessKey,
        config.region,
        config.bucket,
        config.endpoint,
        config.publicUrl,
        config.path || ''
      ])
    }
  }
}
