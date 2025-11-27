<script setup lang="ts">
import * as echarts from 'echarts'
import { ref, nextTick, onMounted, onUnmounted } from 'vue'

// 定义旅游城市数据类型
import type { TravelCity } from '../types/travel'

// 旅游城市数据（从 API 获取）
const travelCities = ref<TravelCity[]>([])

const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
const loading = ref(true)
const error = ref<string | null>(null)
const isVisible = ref(true)

// 用于悬停效果的城市数据和位置
const hoveredCity = ref<TravelCity | null>(null)
const popoverPosition = ref({ x: 0, y: 0 }) // 弹窗在屏幕上的像素位置
const showPopover = ref(false) // 控制弹窗显示
const currentPhotoIndex = ref(0) // 当前显示的照片索引
let hideTimeout: NodeJS.Timeout | null = null // 隐藏定时器ID
let themeObserver: MutationObserver | null = null // 主题观察器

// 响应式调整函数（提升到顶层作用域）
const handleResize = () => {
  chartInstance?.resize()
}

// 照片切换函数
const nextPhoto = () => {
  if (hoveredCity.value?.photos && hoveredCity.value.photos.length > 1) {
    currentPhotoIndex.value = (currentPhotoIndex.value + 1) % hoveredCity.value.photos.length
  }
}

const prevPhoto = () => {
  if (hoveredCity.value?.photos && hoveredCity.value.photos.length > 1) {
    currentPhotoIndex.value = (currentPhotoIndex.value - 1 + hoveredCity.value.photos.length) % hoveredCity.value.photos.length
  }
}

// 清除隐藏定时器
const clearHideTimeout = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

// 隐藏弹窗
const hidePopover = () => {
  clearHideTimeout()
  hideTimeout = setTimeout(() => {
    showPopover.value = false
    hoveredCity.value = null
    currentPhotoIndex.value = 0
  }, 200)
}

// 保持弹窗显示
const keepPopover = () => {
  clearHideTimeout()
  showPopover.value = true
}

// 从 API 加载旅行记录
async function loadTravelRecords() {
  try {
    const response: any = await $fetch('/api/travel/records')
    if (response.success) {
      isVisible.value = response.visible !== false // 默认为 true
      if (response.data) {
        travelCities.value = response.data
        console.log('Loaded travel records:', travelCities.value)
      }
    }
  } catch (err: any) {
    console.error('Failed to load travel records:', err)
    // 如果加载失败，使用空数组
    travelCities.value = []
  }
}

// 带超时的 fetch
async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

// 检测当前主题模式
const isDarkMode = () => {
  if (typeof window === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

// 获取主题相关的颜色配置
const getThemeColors = () => {
  const dark = isDarkMode()
  
  return {
    // 地图区域颜色
    areaColor: dark ? '#1f2937' : '#f9fafb',
    areaEmphasisColor: dark ? '#374151' : '#f3f4f6',
    // 边框颜色
    borderColor: dark ? '#4b5563' : '#d1d5db',
    // 标签颜色
    labelColor: dark ? '#e5e7eb' : '#374151',
    labelBgColor: dark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.8)',
    // 标记点颜色
    markerColor: dark ? '#60a5fa' : '#3b82f6',
    markerEmphasisColor: dark ? '#3b82f6' : '#2563eb',
    markerShadowColor: dark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.5)',
    markerEmphasisShadowColor: dark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)'
  }
}

async function initMap() {
  console.log('Starting to load China map...')

  try {
    // 先加载旅行记录数据
    await loadTravelRecords()
    
    // 如果不显示，直接返回
    if (!isVisible.value) {
      loading.value = false
      return
    }

    // 如果没有数据，显示提示
    if (travelCities.value.length === 0) {
      console.warn('No travel records found')
    }

    // 从后台 API 加载中国地图 GeoJSON 数据
    console.log('Fetching map data from backend API...')
    const mapResponse: any = await $fetch('/api/map/geojson', {
      params: {
        adcode: '100000' // 全国地图
      }
    })
    
    if (!mapResponse.success || !mapResponse.data) {
      throw new Error(mapResponse.error || 'Failed to load map data from backend')
    }
    
    console.log('Map data fetched successfully from backend')
    const chinaJson = mapResponse.data
    
    // 注册中国地图
    echarts.registerMap('china', chinaJson)
    console.log('Map registered with ECharts')

    // 设置加载完成，等待 DOM 更新
    loading.value = false
    
    // 等待 DOM 更新后再初始化图表
    await nextTick()
    
    if (!chartContainer.value) {
      throw new Error('Chart container not found after loading')
    }

    // 初始化图表
    chartInstance = echarts.init(chartContainer.value)
    console.log('ECharts instance initialized')

    // 获取主题颜色
    const colors = getThemeColors()

    // 配置项
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        text: '',
        left: 'center',
        top: '20',
        textStyle: {
          color: colors.labelColor,
          fontSize: 24,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        show: false // 禁用默认悬停提示
      },
      geo: {
        map: 'china',
        roam: true, // 允许缩放和平移
        zoom: 1.2,
        center: [105, 36],
        label: {
          show: false, // 默认不显示城市名
          color: colors.labelColor,
          fontSize: 12
        },
        emphasis: {
          label: {
            show: false // 鼠标悬停时也不显示未访问城市的名称
          },
          itemStyle: {
            areaColor: colors.areaEmphasisColor
          }
        },
        itemStyle: {
          areaColor: colors.areaColor,
          borderColor: colors.borderColor,
          borderWidth: 1,
          shadowColor: isDarkMode() ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 10
        }
      },
      series: [
        {
          name: '旅行城市',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: travelCities.value,
          symbolSize: 16,
          cursor: 'pointer', // 鼠标悬停显示手型
          label: {
            show: true, // 显示访问过的城市名称
            formatter: '{b}',
            position: 'right',
            color: colors.labelColor,
            fontSize: 13,
            fontWeight: 'bold',
            backgroundColor: colors.labelBgColor,
            padding: [4, 8],
            borderRadius: 4
          },
          itemStyle: {
            color: colors.markerColor,
            shadowBlur: 10,
            shadowColor: colors.markerShadowColor
          },
          emphasis: {
            scale: true,
            itemStyle: {
              color: colors.markerEmphasisColor,
              shadowBlur: 20,
              shadowColor: colors.markerEmphasisShadowColor
            }
          }
        },
        {
          name: '闪烁效果',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: travelCities.value,
          symbolSize: 16,
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'stroke',
            scale: 3,
            period: 4
          },
          label: {
            show: false
          },
          itemStyle: {
            color: colors.markerColor,
            shadowBlur: 10,
            shadowColor: colors.markerEmphasisShadowColor
          },
          zlevel: 1
        }
      ]
    }

    chartInstance.setOption(option)
    console.log('Map options set successfully')

    // 监听鼠标悬停事件
    chartInstance.on('mouseover', (params: any) => {
      if (params.componentSubType === 'scatter' || params.componentSubType === 'effectScatter') {
        clearHideTimeout() // 清除之前的隐藏定时器
        
        const cityData = params.data as TravelCity
        hoveredCity.value = cityData
        currentPhotoIndex.value = 0 // 重置照片索引
        
        // 获取鼠标在页面中的位置
        const event = params.event?.event as MouseEvent
        if (event && chartContainer.value) {
          const rect = chartContainer.value.getBoundingClientRect()
          // 计算弹窗位置（鼠标右侧偏移一点）
          popoverPosition.value = {
            x: event.clientX + 15,
            y: event.clientY - 10
          }
        }
        
        showPopover.value = true
      }
    })

    // 监听鼠标移出事件
    chartInstance.on('mouseout', (params: any) => {
      if (params.componentSubType === 'scatter' || params.componentSubType === 'effectScatter') {
        // 延迟隐藏，给用户时间移动到弹窗
        hidePopover()
      }
    })

    // 监听主题变化
    themeObserver = new MutationObserver(() => {
      if (chartInstance) {
        const newColors = getThemeColors()
        chartInstance.setOption({
          title: {
            textStyle: {
              color: newColors.labelColor
            }
          },
          geo: {
            label: {
              color: newColors.labelColor
            },
            emphasis: {
              itemStyle: {
                areaColor: newColors.areaEmphasisColor
              }
            },
            itemStyle: {
              areaColor: newColors.areaColor,
              borderColor: newColors.borderColor,
              shadowColor: isDarkMode() ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'
            }
          },
          series: [
            {
              label: {
                color: newColors.labelColor,
                backgroundColor: newColors.labelBgColor
              },
              itemStyle: {
                color: newColors.markerColor,
                shadowColor: newColors.markerShadowColor
              },
              emphasis: {
                itemStyle: {
                  color: newColors.markerEmphasisColor,
                  shadowColor: newColors.markerEmphasisShadowColor
                }
              }
            },
            {
              itemStyle: {
                color: newColors.markerColor,
                shadowColor: newColors.markerEmphasisShadowColor
              }
            }
          ]
        })
      }
    })

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // 注册窗口大小调整监听器
    window.addEventListener('resize', handleResize)
  } catch (err: any) {
    console.error('Error loading map:', err)
    loading.value = false
    if (err.name === 'AbortError') {
      error.value = '地图加载超时，请检查网络连接后刷新页面'
    } else {
      error.value = `地图加载失败: ${err.message || '未知错误'}`
    }
  }
}

onMounted(() => {
  initMap()
})

// 清理函数
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  themeObserver?.disconnect()
  chartInstance?.dispose()
})
</script>

<template>
  <div v-if="isVisible" class="travel-map-container">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner" />
      <p class="loading-text">加载地图中...</p>
    </div>
    <div v-else-if="error" class="error-container">
      <p class="error-text">{{ error }}</p>
    </div>
    <div v-else class="map-wrapper">
      <!-- 地图容器 -->
      <div ref="chartContainer" class="chart-wrapper" />

      <!-- 悬浮弹窗 -->
      <Transition name="popover-fade">
        <div 
          v-if="showPopover && hoveredCity"
          class="city-popover"
          :style="{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`
          }"
          @mouseenter="keepPopover"
          @mouseleave="hidePopover"
        >
          <div class="popover-content">
            <!-- 头部：城市名和年份徽章 -->
            <div class="popover-header">
              <div>
                <h3 class="popover-city-name">{{ hoveredCity.name }}</h3>
                <p class="popover-city-time">{{ hoveredCity.time }}</p>
              </div>
            </div>

            <!-- 描述 -->
            <p class="popover-description">{{ hoveredCity.description }}</p>

            <!-- 照片预览 -->
            <div v-if="hoveredCity.photos && hoveredCity.photos.length > 0" class="popover-photos">
              <div class="photo-preview-wrapper">
                <div class="photo-preview">
                  <img 
                    :src="hoveredCity.photos[currentPhotoIndex]" 
                    :alt="`${hoveredCity.name} - 照片 ${currentPhotoIndex + 1}`"
                    class="preview-image"
                  />
                </div>
                
                <!-- 照片切换按钮 (仅当有多张图片时显示) -->
                <div v-if="hoveredCity.photos.length > 1" class="photo-controls">
                  <button 
                    @click.stop="prevPhoto"
                    class="photo-nav-btn photo-nav-prev"
                    aria-label="上一张"
                  >
                    <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
                  </button>
                  <button 
                    @click.stop="nextPhoto"
                    class="photo-nav-btn photo-nav-next"
                    aria-label="下一张"
                  >
                    <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
                  </button>
                </div>
                
                <!-- 照片指示器 -->
                <div v-if="hoveredCity.photos.length > 1" class="photo-indicators">
                  <div 
                    v-for="(_, idx) in hoveredCity.photos" 
                    :key="idx"
                    class="photo-indicator"
                    :class="{ 'active': idx === currentPhotoIndex }"
                  />
                </div>
              </div>
            </div>

            <!-- 关联文章按钮 -->
            <UButton
              v-if="hoveredCity.articleLink"
              :to="hoveredCity.articleLink"
              target="_blank"
              label="查看文章"
              icon="i-lucide-arrow-right"
              trailing
              color="primary"
              variant="soft"
              size="xs"
              block
              class="mt-3"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.travel-map-container {
  width: 100%;
  padding: 40px 0;
}

.map-wrapper {
  position: relative;
  width: 100%;
}

.chart-wrapper {
  width: 100%;
  height: 600px;
  min-height: 500px;
}

.loading-container,
.error-container {
  width: 100%;
  height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #6b7280;
  font-size: 16px;
}

.error-text {
  color: #ef4444;
  font-size: 16px;
}

/* 悬浮弹窗样式 */
.city-popover {
  position: fixed;
  z-index: 1000;
  max-width: 320px;
  pointer-events: auto;
  transform: translateY(-50%);
}

.popover-content {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  border: none;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.95);
}

.dark .popover-content {
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(75, 85, 99, 0.3);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.5),
    0 10px 10px -5px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.8);
}

.dark .popover-header {
  border-bottom-color: rgba(75, 85, 99, 0.3);
}

.popover-city-name {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.dark .popover-city-name {
  color: #f9fafb;
}

.popover-city-time {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.popover-city-time::before {
  content: "📅";
  font-size: 12px;
}

.dark .popover-city-time {
  color: #d1d5db;
}

.popover-description {
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(249, 250, 251, 0.8);
  border-radius: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 400;
}

.dark .popover-description {
  color: #e5e7eb;
  background: rgba(31, 41, 55, 0.4);
}

.popover-photos {
  margin-bottom: 4px;
  position: relative;
}

.photo-preview {
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}

.dark .photo-preview {
  background: #374151;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-preview:hover .preview-image {
  transform: scale(1.05);
}

.photo-count-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
  font-weight: 500;
}

/* 照片容器包装 */
.photo-preview-wrapper {
  position: relative;
}

/* 照片切换按钮 */
.photo-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.photo-preview-wrapper:hover .photo-controls {
  opacity: 1;
  pointer-events: auto;
}

.photo-nav-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .photo-nav-btn {
  background: rgba(31, 41, 55, 0.9);
}

.photo-nav-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.dark .photo-nav-btn:hover {
  background: rgba(31, 41, 55, 1);
}

.photo-nav-btn:active {
  transform: scale(0.95);
}

/* 照片指示器 */
.photo-indicators {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 10;
}

.photo-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
  cursor: pointer;
}

.photo-indicator.active {
  background: rgba(255, 255, 255, 0.95);
  width: 18px;
  border-radius: 3px;
}

/* 弹窗过渡动画 */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: all 0.2s ease;
}

.popover-fade-enter-from {
  opacity: 0;
  transform: translateY(-50%) scale(0.95);
}

.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.98);
}

.popover-fade-enter-to,
.popover-fade-leave-from {
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

@media (max-width: 768px) {
  .chart-wrapper,
  .loading-container,
  .error-container {
    height: 400px;
  }
  
  .city-popover {
    max-width: 280px;
  }
  
  .popover-content {
    padding: 12px;
  }
  
  .popover-city-name {
    font-size: 16px;
  }
  
  .popover-description {
    font-size: 12px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}
</style>
