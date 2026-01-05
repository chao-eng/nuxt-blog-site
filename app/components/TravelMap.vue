<script setup lang="ts">
import * as echarts from 'echarts'
import { ref, nextTick, onMounted, onUnmounted } from 'vue'

// 定义旅游城市数据类型
import type { TravelCity } from '../types/travel'

// 旅游城市数据
const travelCities = ref<TravelCity[]>([])

const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
const loading = ref(true)
const error = ref<string | null>(null)
const isVisible = ref(true)

// 悬停交互相关
const hoveredCity = ref<TravelCity | null>(null)
const popoverPosition = ref({ x: 0, y: 0 })
const showPopover = ref(false)
const currentPhotoIndex = ref(0)
let hideTimeout: NodeJS.Timeout | null = null
let themeObserver: MutationObserver | null = null

const handleResize = () => {
  chartInstance?.resize()
}

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

const clearHideTimeout = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

const hidePopover = () => {
  clearHideTimeout()
  hideTimeout = setTimeout(() => {
    showPopover.value = false
    hoveredCity.value = null
    currentPhotoIndex.value = 0
  }, 200)
}

const keepPopover = () => {
  clearHideTimeout()
  showPopover.value = true
}

// 加载数据
async function loadTravelRecords() {
  try {
    const response: any = await $fetch('/api/travel/records')
    if (response.success) {
      isVisible.value = response.visible !== false
      if (response.data) {
        travelCities.value = response.data
      }
    }
  } catch (err: any) {
    console.error('Failed to load travel records:', err)
    travelCities.value = []
  }
}

// 主题颜色配置
const isDarkMode = () => {
  if (typeof window === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

const getThemeColors = () => {
  const dark = isDarkMode()
  return {
    areaColor: dark ? '#1f2937' : '#f9fafb',
    areaEmphasisColor: dark ? '#374151' : '#f3f4f6',
    borderColor: dark ? '#4b5563' : '#d1d5db',
    labelColor: dark ? '#e5e7eb' : '#374151',
    labelBgColor: dark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.8)',
    markerColor: dark ? '#60a5fa' : '#3b82f6',
    markerEmphasisColor: dark ? '#3b82f6' : '#2563eb',
    markerShadowColor: dark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.5)',
    markerEmphasisShadowColor: dark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(37, 99, 235, 0.8)'
  }
}

async function initMap() {
  try {
    await loadTravelRecords()

    if (!isVisible.value) {
      loading.value = false
      return
    }

    const mapResponse: any = await $fetch('/api/map/geojson', {
      params: { adcode: '100000' }
    })

    if (!mapResponse.success || !mapResponse.data) {
      throw new Error(mapResponse.error || 'Failed to load map data')
    }

    echarts.registerMap('china', mapResponse.data)

    loading.value = false
    await nextTick()

    if (!chartContainer.value) throw new Error('Chart container not found')

    chartInstance = echarts.init(chartContainer.value)
    const colors = getThemeColors()

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
      tooltip: { show: false },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [105, 36],
        label: { show: false },
        emphasis: {
          label: { show: false },
          itemStyle: { areaColor: colors.areaEmphasisColor }
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
          cursor: 'pointer',
          label: {
            show: true,
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
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: travelCities.value,
          symbolSize: 16,
          rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
          itemStyle: { color: colors.markerColor },
          zlevel: 1
        }
      ]
    }

    chartInstance.setOption(option)

    chartInstance.on('mouseover', (params: any) => {
      if (params.componentSubType === 'scatter' || params.componentSubType === 'effectScatter') {
        clearHideTimeout()
        hoveredCity.value = params.data as TravelCity
        currentPhotoIndex.value = 0
        const event = params.event?.event as MouseEvent
        if (event) {
          popoverPosition.value = { x: event.clientX + 15, y: event.clientY - 10 }
        }
        showPopover.value = true
      }
    })

    chartInstance.on('mouseout', (params: any) => {
      if (params.componentSubType === 'scatter' || params.componentSubType === 'effectScatter') {
        hidePopover()
      }
    })

    themeObserver = new MutationObserver(() => {
      if (chartInstance) {
        const newColors = getThemeColors()
        chartInstance.setOption({
          title: { textStyle: { color: newColors.labelColor } },
          geo: {
            label: { color: newColors.labelColor },
            emphasis: { itemStyle: { areaColor: newColors.areaEmphasisColor } },
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
              itemStyle: { color: newColors.markerColor },
              emphasis: { itemStyle: { color: newColors.markerEmphasisColor } }
            },
            { itemStyle: { color: newColors.markerColor } }
          ]
        })
      }
    })

    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('resize', handleResize)
  } catch (err: any) {
    console.error('Error loading map:', err)
    loading.value = false
    error.value = `地图加载失败: ${err.message}`
  }
}

onMounted(() => initMap())
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
      <p class="loading-text">
        加载地图中...
      </p>
    </div>
    <div v-else-if="error" class="error-container">
      <p class="error-text">
        {{ error }}
      </p>
    </div>
    <div v-else class="map-wrapper">
      <div ref="chartContainer" class="shadow-lg chart-wrapper bg-white/50 dark:bg-slate-800/50" />

      <Transition name="popover-fade">
        <div
          v-if="showPopover && hoveredCity"
          class="city-popover"
          :style="{ left: `${popoverPosition.x}px`, top: `${popoverPosition.y}px` }"
          @mouseenter="keepPopover"
          @mouseleave="hidePopover"
        >
          <div class="popover-content">
            <div class="popover-header">
              <div>
                <h3 class="popover-city-name">
                  {{ hoveredCity.name }}
                </h3>
                <p class="popover-city-time">
                  {{ hoveredCity.time }}
                </p>
              </div>
            </div>
            <p class="popover-description">
              {{ hoveredCity.description }}
            </p>

            <div v-if="hoveredCity.photos && hoveredCity.photos.length > 0" class="popover-photos">
              <div class="photo-preview-wrapper">
                <div class="photo-preview">
                  <img
                    :src="hoveredCity.photos[currentPhotoIndex]"
                    class="preview-image"
                  >
                </div>
                <div v-if="hoveredCity.photos.length > 1" class="photo-controls">
                  <button class="photo-nav-btn" @click.stop="prevPhoto">
                    <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
                  </button>
                  <button class="photo-nav-btn" @click.stop="nextPhoto">
                    <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
                  </button>
                </div>
                <div v-if="hoveredCity.photos.length > 1" class="photo-indicators">
                  <div
                    v-for="(_, idx) in hoveredCity.photos"
                    :key="idx"
                    class="photo-indicator"
                    :class="{ active: idx === currentPhotoIndex }"
                  />
                </div>
              </div>
            </div>

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
              :ui="{ rounded: 'rounded-xl' }"
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

/* 核心修改 1: 地图容器样式
  增加 border-radius 和 overflow: hidden
*/
.chart-wrapper {
  width: 100%;
  height: 600px;
  min-height: 500px;
  border-radius: 24px; /* 大圆角 */
  overflow: hidden;    /* 关键：防止地图 Canvas 溢出圆角 */
  transition: all 0.3s ease;
}

/* 核心修改 2: 加载和错误状态容器
  同样增加圆角和背景，保持视觉一致性
*/
.loading-container,
.error-container {
  width: 100%;
  height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-radius: 24px; /* 保持一致的大圆角 */
  background-color: rgba(255, 255, 255, 0.5); /* 浅色背景 */
  backdrop-filter: blur(8px); /* 可选：毛玻璃效果 */
}

.dark .loading-container,
.dark .error-container {
  background-color: rgba(31, 41, 55, 0.3); /* 深色背景 */
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-text { color: #6b7280; font-size: 16px; }
.error-text { color: #ef4444; font-size: 16px; }

/* 悬浮弹窗相关样式 (保持圆角风格) */
.city-popover {
  position: fixed;
  z-index: 1000;
  max-width: 320px;
  pointer-events: auto;
  transform: translateY(-50%);
}

.popover-content {
  background: white;
  border-radius: 24px;
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
.dark .popover-header { border-bottom-color: rgba(75, 85, 99, 0.3); }

.popover-city-name {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
  line-height: 1.3;
}
.dark .popover-city-name { color: #f9fafb; }

.popover-city-time {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.popover-city-time::before { content: "📅"; font-size: 12px; }
.dark .popover-city-time { color: #d1d5db; }

.popover-description {
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(249, 250, 251, 0.8);
  border-radius: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 400;
}
.dark .popover-description { color: #e5e7eb; background: rgba(31, 41, 55, 0.4); }

.popover-photos { margin-bottom: 4px; position: relative; }

.photo-preview {
  aspect-ratio: 16/9;
  border-radius: 16px;
  overflow: hidden;
  background: #f3f4f6;
  position: relative;
}
.dark .photo-preview { background: #374151; }

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.photo-preview:hover .preview-image { transform: scale(1.05); }

.photo-preview-wrapper { position: relative; }

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
.photo-preview-wrapper:hover .photo-controls { opacity: 1; pointer-events: auto; }

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
.dark .photo-nav-btn { background: rgba(31, 41, 55, 0.9); }
.photo-nav-btn:hover { transform: scale(1.1); background: #fff; }
.dark .photo-nav-btn:hover { background: #374151; }
.photo-nav-btn:active { transform: scale(0.95); }

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
  border-radius: 999px;
}

.popover-fade-enter-active, .popover-fade-leave-active { transition: all 0.2s ease; }
.popover-fade-enter-from { opacity: 0; transform: translateY(-50%) scale(0.95); }
.popover-fade-leave-to { opacity: 0; transform: translateY(-50%) scale(0.98); }
.popover-fade-enter-to, .popover-fade-leave-from { opacity: 1; transform: translateY(-50%) scale(1); }

@media (max-width: 768px) {
  .chart-wrapper, .loading-container, .error-container { height: 400px; }
  .city-popover { max-width: 280px; }
  .popover-content { padding: 12px; }
  .popover-city-name { font-size: 16px; }
  .popover-description { font-size: 12px; -webkit-line-clamp: 2; line-clamp: 2; }
}
</style>
