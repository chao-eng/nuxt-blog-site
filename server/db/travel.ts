import { db, dbCommon } from './db'

/**
 * 初始化旅行记录表
 */
export function initTravelTable(): void {
  // 创建旅行记录表
  const createTravelRecordsTable = db.prepare(`
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
}

/**
 * 旅行记录模块数据库操作
 */
export const dbTravel = {
  /**
     * 获取旅行记录数据
     * @returns 旅行记录对象，包含 data 和 visible
     */
  getTravelRecords: (): { data: string, visible: boolean } => {
    const sql = 'SELECT data, visible FROM travel_records ORDER BY id DESC LIMIT 1'
    const result = dbCommon.get<{ data: string, visible: number }>(sql)
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
    } catch {
      throw new Error('Invalid JSON format')
    }

    // 检查是否已有记录
    const existingRecord = dbCommon.get<{ id: number }>('SELECT id FROM travel_records LIMIT 1')

    const visibleValue = visible ? 1 : 0

    if (existingRecord) {
      // 更新现有记录
      const sql = 'UPDATE travel_records SET data = ?, visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      return dbCommon.run(sql, [data, visibleValue, existingRecord.id])
    } else {
      // 插入新记录
      const sql = 'INSERT INTO travel_records (data, visible) VALUES (?, ?)'
      return dbCommon.run(sql, [data, visibleValue])
    }
  }
}
