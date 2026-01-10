// server/utils/s3.ts
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { dbS3Config } from '../db/settings'

export async function uploadToS3(fileData: Buffer, fileName: string, contentType: string) {
    const s3Config = dbS3Config.getConfig()
    if (!s3Config || !s3Config.enableS3) {
        return null
    }

    const client = new S3Client({
        region: s3Config.region,
        endpoint: s3Config.endpoint,
        credentials: {
            accessKeyId: s3Config.accessKeyId,
            secretAccessKey: s3Config.secretAccessKey
        },
        forcePathStyle: true
    })

    const s3Path = s3Config.path ? (s3Config.path.endsWith('/') ? s3Config.path : `${s3Config.path}/`) : ''
    const key = `${s3Path}${fileName}`

    const command = new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
        Body: fileData,
        ContentType: contentType
    })

    await client.send(command)

    const publicUrl = s3Config.publicUrl.endsWith('/') ? s3Config.publicUrl : `${s3Config.publicUrl}/`
    return `${publicUrl}${key}`
}

export async function testS3Connection(config: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    bucket: string
    endpoint: string
}) {
    const client = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        },
        forcePathStyle: true,
        maxAttempts: 1
    })

    // 尝试列出存储桶中的 1 个文件来验证连接
    const command = new ListObjectsV2Command({
        Bucket: config.bucket,
        MaxKeys: 1
    })

    try {
        await client.send(command)
        return { success: true }
    } catch (error: any) {
        console.error('S3 Connection Test Failed:', error)
        return {
            success: false,
            message: error.message || 'Connection failed'
        }
    }
}
