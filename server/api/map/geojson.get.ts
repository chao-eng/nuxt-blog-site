/**
 * 获取地图 GeoJSON 数据的 API
 * 用于避免前端直接调用 geo.datav.aliyun.com 产生的跨域问题
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const adCode = query.adcode || '100000' // 默认获取全国地图，adcode 为行政区划代码

  try {
    // 从阿里云 DataV 获取地图数据
    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adCode}_full.json`

    console.log(`Fetching map data for adcode: ${adCode}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch map data: ${response.status} ${response.statusText}`)
    }

    const geoJson = await response.json()

    // 设置响应头，允许缓存以提高性能
    setResponseHeaders(event, {
      'Cache-Control': 'public, max-age=86400', // 缓存 24 小时
      'Content-Type': 'application/json'
    })

    return {
      success: true,
      data: geoJson
    }
  } catch (error) {
    console.error('Error fetching map data:', error)

    return {
      success: false,
      error: (error as Error).message || 'Failed to fetch map data'
    }
  }
})
