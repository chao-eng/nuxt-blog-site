import { getServerUptime } from '../../utils/uptime'

export default defineEventHandler(() => {
    const uptime = getServerUptime()

    return {
        success: true,
        uptime,
        startTime: Date.now() - uptime
    }
})
