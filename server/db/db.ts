import Database from 'better-sqlite3'
import { join } from 'path'

// 确定数据库文件路径（项目根目录下的 data 文件夹）
const dbPath = join(useRuntimeConfig().dbPath) // 数据库文件路径：项目根目录/data/db.sqlite

// 创建数据库连接（单例模式，避免重复创建连接）
export const db: Database.Database = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined // 开发环境打印 SQL 日志
})

/**
 * 通用数据库操作工具
 * 封装常用的查询、插入、更新等方法，并添加类型约束
 */
export const dbCommon = {
    /**
     * 查询单条数据
     * @param sql SQL 语句
     * @param params 查询参数（数组或对象）
     * @returns 单条数据对象（或 undefined）
     */
    get: <T = Record<string, any>>(sql: string, params?: any[] | object): T | undefined => {
        const statement = db.prepare(sql)
        return params === undefined ? statement.get() as T | undefined : statement.get(params) as T | undefined
    },

    /**
     * 查询多条数据
     * @param sql SQL 语句
     * @param params 查询参数（数组或对象）
     * @returns 数据对象数组
     */
    all: <T = Record<string, any>>(sql: string, params?: any[] | object): T[] => {
        const statement = db.prepare(sql)
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
        const statement = db.prepare(sql)
        return params === undefined ? statement.run() : statement.run(params)
    },

    /**
     * 获取最后插入的记录 ID
     * @returns 最后插入的 ID（数字）
     */
    lastInsertRowid: (): number | bigint => {
        const result = db.prepare('SELECT last_insert_rowid() as id').get() as { id: number | bigint }
        return result.id
    }
}
