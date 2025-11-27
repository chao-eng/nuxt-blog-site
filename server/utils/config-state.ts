// 全局配置状态管理
interface UmamiConfig {
    enableUmami: boolean
    scriptUrl: string
    websiteId: string
    shareUrl?: string
}

interface CommentsConfig {
    enableComments: boolean
    repo: string
    repoId: string
    category: string
    categoryId: string
}

// 使用全局变量存储配置（在服务端初始化时加载）
let umamiConfig: UmamiConfig | null = null
let commentsConfig: CommentsConfig | null = null

export function setUmamiConfig(config: UmamiConfig) {
    umamiConfig = config
}

export function getUmamiConfig(): UmamiConfig | null {
    return umamiConfig
}

export function setCommentsConfig(config: CommentsConfig) {
    commentsConfig = config
}

export function getCommentsConfig(): CommentsConfig | null {
    return commentsConfig
}
