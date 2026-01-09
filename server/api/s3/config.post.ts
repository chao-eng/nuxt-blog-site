// server/api/s3/config.post.ts
import { dbS3Config } from '../../db'
import { testS3Connection } from '../../utils/s3'
import type { Result } from '~/types'

export default defineEventHandler(async (event): Promise<Result<undefined>> => {
    try {
        const body = await readBody(event)

        // 如果开启了 S3，则进行连接测试
        if (body.enableS3) {
            const testResult = await testS3Connection({
                accessKeyId: body.accessKeyId,
                secretAccessKey: body.secretAccessKey,
                region: body.region || 'auto',
                bucket: body.bucket,
                endpoint: body.endpoint
            })

            if (!testResult.success) {
                return {
                    success: false,
                    err: `连接测试失败: ${testResult.message}`,
                    data: undefined
                }
            }
        }

        dbS3Config.saveConfig(body)

        return {
            success: true,
            err: '',
            data: undefined
        }
    } catch (error: unknown) {
        return {
            success: false,
            err: (error as Error).message,
            data: undefined
        }
    }
})
