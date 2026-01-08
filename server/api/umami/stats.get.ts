import { getUmamiConfig } from '../../utils/config-state'

export default defineEventHandler(async (event) => {
  const config = getUmamiConfig()

  if (!config || !config.enableUmami || !config.scriptUrl || !config.websiteId) {
    return {
      success: false,
      message: 'Umami not configured'
    }
  }

  try {
    const url = new URL(config.scriptUrl)
    const apiBase = url.origin

    // 获取时间范围参数，默认为 7 天
    const query = getQuery(event)
    const range = (query.range as string) || '7d'

    // 计算时间范围（毫秒）
    const rangeMap: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }

    const rangeMs = rangeMap[range] || 7 * 24 * 60 * 60 * 1000

    // 如果配置了共享链接，使用共享链接获取详细数据
    if (config.shareUrl) {
      try {
        // 1. 解析 shareId
        const shareUrlObj = new URL(config.shareUrl)
        const pathParts = shareUrlObj.pathname.split('/')
        const shareId = pathParts[pathParts.length - 1]

        if (!shareId) throw new Error('Invalid share URL')

        // 2. 获取 Token
        const shareData = await $fetch<{ token: string, websiteId?: string }>(`${apiBase}/api/share/${shareId}`)
        if (!shareData || !shareData.token) throw new Error('Failed to get share token')

        const token = shareData.token
        const websiteId = shareData.websiteId || config.websiteId

        // 3. 获取统计数据
        const endAt = Date.now()
        const startAt = endAt - rangeMs

        const statsData = await $fetch<Record<string, { value: number } | number>>(`${apiBase}/api/websites/${websiteId}/stats`, {
          params: {
            startAt,
            endAt,
            unit: 'hour',
            timezone: 'Asia/Shanghai'
          },
          headers: {
            'x-umami-share-token': token
          }
        })

        return {
          success: true,
          data: {
            pageViews: statsData.pageviews && typeof statsData.pageviews === 'object' ? statsData.pageviews.value : (statsData.pageviews || 0),
            visitors: statsData.visitors && typeof statsData.visitors === 'object' ? statsData.visitors.value : (statsData.visitors || 0),
            visits: statsData.visits && typeof statsData.visits === 'object' ? statsData.visits.value : (statsData.visits || 0)
          }
        }
      } catch (shareError) {
        console.error('Umami Share API Error:', shareError)
        throw shareError
      }
    }

    return {
      success: false,
      message: 'Umami share URL not configured'
    }
  } catch (error) {
    console.error('Umami API Error:', error)
    return {
      success: false,
      message: (error as Error).message || 'Failed to fetch stats'
    }
  }
})
