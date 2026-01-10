// server/api/s3/config.get.ts
import { dbS3Config } from '../../db'
import type { Result } from '~/types'

export default defineEventHandler(async (event): Promise<Result<Record<string, any>>> => {
    try {
        const config = dbS3Config.getConfig()
        return {
            success: true,
            err: '',
            data: config || {}
        }
    } catch (error: unknown) {
        return {
            success: false,
            err: (error as Error).message,
            data: {}
        }
    }
})
