// 记录服务器启动时间
const serverStartTime = Date.now()

export function getServerStartTime() {
    return serverStartTime
}

export function getServerUptime() {
    return Date.now() - serverStartTime
}
