<script setup lang="ts">
import * as echarts from 'echarts'
import { ref, nextTick, onMounted, onUnmounted } from 'vue'

// 定义旅游城市数据类型
import type { TravelCity } from '../types/travel'

// 旅游城市数据
const travelCities = ref<TravelCity[]>([])

interface TravelRecordsResponse {
  success: boolean
  visible?: boolean
  data?: TravelCity[]
}

interface MapGeoJsonResponse {
  success: boolean
  data?: unknown
  error?: string
}

interface EChartsEventParams {
  componentSubType: string
  data: TravelCity
  event?: {
    event: MouseEvent
  }
}

const chartContainer = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
const loading = ref(true)
const error = ref<string | null>(null)
const isVisible = ref(true)

const { t } = useI18n()

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
    const response = await $fetch<TravelRecordsResponse>('/api/travel/records')
    if (response.success) {
      isVisible.value = response.visible !== false
      if (response.data) {
        travelCities.value = response.data
      }
    }
  } catch (err) {
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
    areaColor: dark ? '#0f172a' : '#f1f5f9',
    areaEmphasisColor: dark ? '#1e293b' : '#e2e8f0',
    borderColor: dark ? '#334155' : '#cbd5e1',
    labelColor: dark ? '#94a3b8' : '#64748b',
    labelBgColor: dark ? '#1e293b' : '#ffffff',
    markerColor: '#4f46e5',
    markerEmphasisColor: '#8b5cf6',
    markerShadowColor: 'rgba(79, 70, 229, 0.4)',
    markerEmphasisShadowColor: 'rgba(139, 92, 246, 0.6)'
  }
}

async function initMap() {
  try {
    await loadTravelRecords()

    if (!isVisible.value) {
      loading.value = false
      return
    }

    const mapResponse = await $fetch<MapGeoJsonResponse>('/api/map/geojson', {
      params: { adcode: '100000' }
    })

    if (!mapResponse.success || !mapResponse.data) {
      throw new Error(mapResponse.error || 'Failed to load map data')
    }

    echarts.registerMap('china', mapResponse.data as any)

    loading.value = false
    await nextTick()

    if (!chartContainer.value) throw new Error('Chart container not found')

    chartInstance = echarts.init(chartContainer.value)
    const colors = getThemeColors()

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: { show: false },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [105, 36],
        label: { show: false },
        emphasis: {
          label: { show: false },
          itemStyle: { 
            areaColor: colors.areaEmphasisColor,
            borderColor: '#4f46e5',
            borderWidth: 1.2
          }
        },
        itemStyle: {
          areaColor: colors.areaColor,
          borderColor: colors.borderColor,
          borderWidth: 0.8,
          shadowColor: 'rgba(0, 0, 0, 0.05)',
          shadowBlur: 5
        }
      },
      series: [
        {
          name: '旅行城市',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: travelCities.value,
          symbolSize: 12,
          cursor: 'pointer',
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: colors.labelColor,
            fontSize: 10,
            fontWeight: 'bold',
            backgroundColor: colors.labelBgColor,
            padding: [4, 8],
            borderRadius: 6,
            borderWidth: 1,
            borderColor: colors.borderColor
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
          symbolSize: 12,
          rippleEffect: { brushType: 'stroke', scale: 3.5, period: 4 },
          itemStyle: { 
            color: colors.markerColor
          },
          zlevel: 1
        }
      ]
    }

    chartInstance.setOption(option)

    chartInstance.on('mouseover', (params: unknown) => {
      const p = params as EChartsEventParams
      if (p.componentSubType === 'scatter' || p.componentSubType === 'effectScatter') {
        clearHideTimeout()
        hoveredCity.value = p.data
        currentPhotoIndex.value = 0
        const event = p.event?.event as MouseEvent
        if (event) {
          popoverPosition.value = { x: event.clientX + 20, y: event.clientY }
        }
        showPopover.value = true
      }
    })

    chartInstance.on('mouseout', (params: unknown) => {
      const p = params as EChartsEventParams
      if (p.componentSubType === 'scatter' || p.componentSubType === 'effectScatter') {
        hidePopover()
      }
    })

    themeObserver = new MutationObserver(() => {
      if (chartInstance) {
        const newColors = getThemeColors()
        chartInstance.setOption({
          geo: {
            itemStyle: {
              areaColor: newColors.areaColor,
              borderColor: newColors.borderColor
            }
          },
          series: [
            {
              label: {
                color: newColors.labelColor,
                backgroundColor: newColors.labelBgColor,
                borderColor: newColors.borderColor
              }
            }
          ]
        })
      }
    })

    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('resize', handleResize)
  } catch (err) {
    console.error('Error loading map:', err)
    loading.value = false
    error.value = `地图加载失败: ${(err as Error).message}`
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
  <div v-if="isVisible" class="travel-map-container animate-in">
    <div v-if="loading" class="travel-loading-glass">
      <div class="spinner-container">
        <div class="cyber-spinner" />
      </div>
      <p class="loading-text uppercase tracking-widest text-[10px] font-bold text-slate-400">
        {{ t('nav.loading') }}
      </p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="text-red-500 font-bold text-sm">
        {{ error }}
      </p>
    </div>

    <div v-else class="map-wrapper relative">
      <div ref="chartContainer" class="chart-wrapper-main" />

      <!-- 足迹浮窗 -->
      <Transition name="popover-clean">
        <div
          v-if="showPopover && hoveredCity"
          class="city-popover-clean"
          :style="{ left: `${popoverPosition.x}px`, top: `${popoverPosition.y}px` }"
          @mouseenter="keepPopover"
          @mouseleave="hidePopover"
        >
          <div class="popover-card shadow-xl">
            <!-- 头部 -->
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 class="text-slate-900 dark:text-white font-black text-lg leading-tight">{{ hoveredCity.name }}</h3>
                <span class="text-xs font-bold text-slate-400 tracking-wider">{{ hoveredCity.time }}</span>
              </div>
            </div>

            <!-- 描述 -->
            <div class="description-area mb-4">
              <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                {{ hoveredCity.description }}
              </p>
            </div>

            <!-- 图片 -->
            <div v-if="hoveredCity.photos && hoveredCity.photos.length > 0" class="photo-area mb-4 relative group">
              <div class="aspect-video rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <Transition name="fade-fast" mode="out-in">
                  <img
                    :key="currentPhotoIndex"
                    :src="hoveredCity.photos[currentPhotoIndex]"
                    class="w-full h-full object-cover"
                    @error="(e: any) => e.target.style.display = 'none'"
                  >
                </Transition>
                
                <!-- 切换 -->
                <div v-if="hoveredCity.photos.length > 1" class="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="nav-btn" @click.stop="prevPhoto">
                    <UIcon name="i-lucide-chevron-left" class="w-4 h-4" />
                  </button>
                  <button class="nav-btn" @click.stop="nextPhoto">
                    <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 底部 -->
            <UButton
              v-if="hoveredCity.articleLink"
              :to="hoveredCity.articleLink"
              target="_blank"
              color="primary"
              variant="solid"
              block
              class="rounded-xl font-bold py-2.5 shadow-lg shadow-primary-500/20"
            >
              {{ t('nav.articles') === '文章' ? '查看游记' : 'SEE ARTICLE' }}
              <template #trailing>
                <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
              </template>
            </UButton>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.travel-map-container {
  width: 100%;
  background: white;
  border-radius: 2rem;
}

.dark .travel-map-container { background: #020617; }

.travel-loading-glass {
  height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.spinner-container {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.chart-wrapper-main { width: 100%; height: 650px; }

.city-popover-clean {
  position: fixed;
  z-index: 9999;
  width: 320px;
  pointer-events: auto;
  transform: translateY(-50%);
}

.popover-card {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 1.75rem;
  padding: 1.25rem;
}

.dark .popover-card {
  background: #1e293b;
  border-color: #334155;
}

.nav-btn {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.popover-clean-enter-active, .popover-clean-leave-active {
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.popover-clean-enter-from { opacity: 0; transform: translateY(-40%) scale(0.95); }
.popover-clean-leave-to { opacity: 0; transform: translateY(-60%) scale(0.95); }

.fade-fast-enter-active, .fade-fast-leave-active { transition: opacity 0.2s ease; }
.fade-fast-enter-from, .fade-fast-leave-to { opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .chart-wrapper-main { height: 400px; }
  .city-popover-clean { width: 280px; }
}
</style>
