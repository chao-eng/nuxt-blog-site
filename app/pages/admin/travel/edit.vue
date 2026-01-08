<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { Result } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

interface TravelCity {
  name: string
  value: [number, number] // [经度, 纬度]
  time: string
  description: string
  photos?: string[]
  articleLink?: string
}

// ----------------------------------------------------
// 核心状态和映射
// ----------------------------------------------------
const route = useRoute()
const toast = useToast()
const saving = ref(false)
const uploading = ref(false)
const mapLoading = ref(true)

// 行政区划代码映射 (只保留省份级别，用于第一次钻取)
const adCodeMap: Record<string, string> = {
  河北省: '130000', 山西省: '140000', 辽宁省: '210000',
  吉林省: '220000', 黑龙江省: '230000', 上海市: '310000',
  江苏省: '320000', 浙江省: '330000', 安徽省: '340000',
  福建省: '350000', 江西省: '360000', 山东省: '370000',
  河南省: '410000', 湖北省: '420000', 湖南省: '430000',
  广东省: '440000', 海南省: '460000', 四川省: '510000',
  贵州省: '520000', 云南省: '530000', 陕西省: '610000',
  甘肃省: '620000', 青海省: '630000', 内蒙古自治区: '150000',
  广西壮族自治区: '450000', 西藏自治区: '540000', 宁夏回族自治区: '640000',
  新疆维吾尔自治区: '650000', 北京市: '110000', 天津市: '120000',
  重庆市: '500000'
  // 注意：港澳台 GeoJSON 通常需要特殊处理或单独提供，这里简化处理。
}
// 存储地图历史栈：记录当前显示的地图名称和中心点
const mapHistory = ref<{ mapName: string, adCode: string }[]>(
  [{ mapName: 'china', adCode: '100000' }] // 初始为全国
)
// 缓存已加载的 GeoJSON
const geoJsonCache: Record<string, any> = {}

// 表单数据
const formData = ref<TravelCity>({
  name: '',
  value: [116.4074, 39.9042], // 默认北京坐标
  time: '',
  description: '',
  photos: [],
  articleLink: ''
})

// 编辑模式
const isEditMode = ref(false)
const editIndex = ref(-1)

// 页面标题（computed）
const pageTitle = computed(() => isEditMode.value ? t('admin.tra.editTitle') : t('admin.tra.addTitle'))

// 地图相关
const chartContainer = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// 文件上传相关
const fileRef = ref<HTMLInputElement>()

// ----------------------------------------------------
// 核心功能函数 (确保在顶层，解决 Vue warn 错误)
// ----------------------------------------------------

// 响应式调整函数 (在模板中未使用，但需要定义以供 window.resize 调用)
function handleResize() {
  chartInstance?.resize()
}

/**
 * 加载并注册下一级行政区划的 GeoJSON
 * @param adCode 当前行政区的 AdCode (例如 510000)
 */
async function loadAndRegisterNextMap(adCode: string): Promise<string> {
  const mapName = `map-${adCode}`

  // 1. 检查缓存和注册
  if (echarts.getMap(mapName)) {
    return mapName
  }

  // 2. 异步加载 GeoJSON
  const mapResponse = await $fetch<Result<unknown>>('/api/map/geojson', {
    params: { adcode: adCode }
  })

  if (!mapResponse.success || !mapResponse.data) {
    throw new Error(`Failed to load map data for AdCode ${adCode}: ${mapResponse.err}`)
  }

  const geoJson = mapResponse.data as any

  // 3. 注册地图
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerMap(mapName, geoJson)
  geoJsonCache[adCode] = geoJson

  return mapName
}

/**
 * 更新地图标记（用于更新选点标记和配置）
 */
function updateMapMarker() {
  if (!chartInstance) return

  const currentMap = mapHistory.value[mapHistory.value.length - 1]
  if (!currentMap) return

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const p = params as { componentSubType: string, name: string }
        if (p.componentSubType === 'scatter') {
          return `
                <div style="padding: 8px;">
                  <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">当前选择位置</div>
                  <div style="color: #666;">经度: ${formData.value.value[0]}</div>
                  <div style="color: #666;">纬度: ${formData.value.value[1]}</div>
                </div>
              `
        }
        // 显示行政区划名称
        return params.name
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' }
    },
    geo: {
      map: currentMap.mapName, // 动态切换地图名称
      roam: true,
      zoom: (chartInstance.getOption() as any)?.geo?.[0]?.zoom || 1, // 保持缩放
      center: (chartInstance.getOption() as any)?.geo?.[0]?.center || undefined, // 保持中心
      label: {
        show: true,
        formatter: (params: { name: string }) => params.name,
        color: '#333',
        fontSize: 10
      },
      emphasis: { label: { show: true, color: '#000' } },
      itemStyle: { areaColor: '#f5f5f5', borderColor: '#ccc' }
    },
    series: [
      // 1. 选中位置的散点标记
      {
        name: '选中位置',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: [{ name: formData.value.name || '选择的位置', value: formData.value.value }],
        symbolSize: 12,
        itemStyle: { color: 'error' },
        label: {
          show: true, // 始终显示选中位置的标签
          formatter: formData.value.name || '选择的位置',
          position: 'right',
          fontWeight: 'bold',
          color: '#333'
        }
      },
      // 2. 闪烁效果（可选）
      {
        name: '闪烁效果',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: [{ name: formData.value.name || '选择的位置', value: formData.value.value }],
        symbolSize: 20,
        showEffectOn: 'render',
        rippleEffect: { brushType: 'stroke', scale: 3, period: 4 },
        label: { show: false },
        itemStyle: { color: '#ef4444', shadowBlur: 10, shadowColor: 'rgba(239, 68, 68, 0.8)' },
        zlevel: 1
      }
    ]
  }

  chartInstance.setOption(option, { notMerge: false })
}

/**
 * 切换地图，执行钻取操作
 * @param newMapName 新地图的名称 (已注册的名称或 AdCode)
 * @param newAdCode 新地图的 AdCode (例如 510000)
 */
function switchMap(newMapName: string, newAdCode: string) {
  if (!chartInstance) return

  // 更新历史栈
  mapHistory.value.push({ mapName: newMapName, adCode: newAdCode })

  // 更新 ECharts 配置，执行地图切换
  const newOption: echarts.EChartsOption = {
    geo: {
      map: newMapName,
      zoom: 1, // 重置缩放
      center: undefined // 自动居中
    },
    series: [{
      type: 'scatter',
      coordinateSystem: 'geo',
      // 重新设置 scatter data，确保它在新地图上居中
      data: [{ name: formData.value.name || '选择的位置', value: formData.value.value }]
    }]
  }

  // 使用不合并选项，确保地图彻底重绘
  chartInstance.setOption(newOption, { notMerge: false })

  // 更新标记，确保新的 Geo 标签显示
  updateMapMarker()
}

/**
 * 返回上一级地图 (在模板中使用 @click="goBackToChina")
 */
function goBackToChina() {
  if (mapHistory.value.length <= 1 || !chartInstance) {
    toast.add({ title: '提示', description: '已是最高级地图 (全国)', color: 'neutral' })
    return
  }

  // 弹出当前地图，回到上一个地图
  mapHistory.value.pop()
  const prevMap = mapHistory.value[mapHistory.value.length - 1]
  if (!prevMap) return

  chartInstance.setOption({
    geo: {
      map: prevMap.mapName,
      zoom: 1,
      center: undefined
    }
  }, { notMerge: false })

  updateMapMarker()
  toast.add({ title: '返回成功', description: `当前地图：${prevMap.mapName.replace('map-', 'AdCode ')}`, color: 'primary' })
}

// 初始化地图
async function initMap() {
  try {
    mapLoading.value = true

    // 1. 加载并注册中国地图 GeoJSON 数据
    const chinaMapName = await loadAndRegisterNextMap('100000')

    // 确保历史栈初始正确
    mapHistory.value = [{ mapName: chinaMapName, adCode: '100000' }]

    await nextTick()

    if (!chartContainer.value) {
      throw new Error('Chart container not found')
    }

    // 尺寸检查 (保持不变)
    if (chartContainer.value.clientWidth === 0 || chartContainer.value.clientHeight === 0) {
      await new Promise(resolve => setTimeout(resolve, 50))
      if (chartContainer.value.clientWidth === 0 || chartContainer.value.clientHeight === 0) {
        console.error('ECharts容器尺寸仍然为零，初始化失败。')
        throw new Error('ECharts容器尺寸仍然为零，请检查其父组件是否隐藏或高度限制。')
      }
    }

    chartInstance = echarts.init(chartContainer.value)
    mapLoading.value = false

    updateMapMarker()

    // 监听地图点击事件：实现钻取和选点
    chartInstance.on('click', (params: any) => {
      const p = params as { componentType?: string, componentSubType?: string, name: string, event: { offsetX: number, offsetY: number } }
      
      const handleClick = async () => {
        if (p.componentType === 'geo' || p.componentSubType === 'map') {
          if (!p.event) return
          // 1. 更新选点坐标
          const pointInPixel = [p.event.offsetX, p.event.offsetY]
          const pointInGeo = chartInstance!.convertFromPixel({ geoIndex: 0 }, pointInPixel)

          if (pointInGeo && Array.isArray(pointInGeo)) {
            const geoPoint = pointInGeo as number[]
            formData.value.value = [
              Math.round(geoPoint[0]! * 1000000) / 1000000,
              Math.round(geoPoint[1]! * 1000000) / 1000000
            ]
            updateMapMarker()
          }

          // 2. 尝试向下钻取
          const currentMapTop = mapHistory.value[mapHistory.value.length - 1]
          if (!currentMapTop) return
          const currentAdCode = currentMapTop.adCode

          let nextAdCode = ''
          if (currentAdCode === '100000') {
            // 全国地图 -> 查找省份 AdCode
            nextAdCode = adCodeMap[p.name] || ''
          } else {
            // 省级/市级地图 -> 查找下一级 AdCode
            const currentGeoJson = geoJsonCache[currentAdCode]
            const feature = currentGeoJson?.features?.find((f: any) => f.properties.name === p.name)
            nextAdCode = feature?.properties?.adcode || ''
          }

          // 如果找到了下一级 AdCode，则执行切换
          if (nextAdCode) {
            try {
              const newMapName = await loadAndRegisterNextMap(nextAdCode)
              switchMap(newMapName, nextAdCode)
            } catch {
              // Ignore drill error
            }
          }
        }
      }

      handleClick()
    })

    window.addEventListener('resize', handleResize)
  } catch (err: unknown) {
    mapLoading.value = false
    toast.add({
      title: '地图加载失败',
      description: (err as Error).message || '无法加载中国地图',
      color: 'error'
    })
  }
}

// 加载现有数据
async function loadData() {
  try {
    const response = await $fetch<Result<TravelCity[]>>('/api/travel/records')
    if (response.success && response.data) {
      const data = Array.isArray(response.data) ? response.data : []

      if (route.query.index !== undefined) {
        const index = parseInt(route.query.index as string)
        if (index >= 0 && index < data.length) {
          isEditMode.value = true
          editIndex.value = index
          formData.value = { ...data[index] } as TravelCity
        }
      }
    }
  } catch (error: unknown) {
    toast.add({
      title: '加载失败',
      description: (error as Error).message || '无法加载旅行记录',
      color: 'error'
    })
  }
}

// 点击上传按钮 (在模板中使用 @click="onFileClick")
function onFileClick() {
  fileRef.value?.click()
}

// 手动更新经纬度时同步地图 (在模板中使用 @change="onCoordinateChange")
function onCoordinateChange() {
  if (typeof formData.value.value[0] === 'number' && typeof formData.value.value[1] === 'number') {
    updateMapMarker()
    if (chartInstance) {
      chartInstance.setOption({
        geo: {
          center: formData.value.value
        }
      })
    }
  } else {
    toast.add({
      title: '输入错误',
      description: '经纬度必须是有效的数字',
      color: 'error'
    })
  }
}

// 上传图片
async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  uploading.value = true
  try {
    for (const file of Array.from(files)) {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (response.url) {
        if (!formData.value.photos) {
          formData.value.photos = []
        }
        formData.value.photos.push(response.url)
      }
    }

    toast.add({
      title: '上传成功',
      description: `成功上传 ${files.length} 张图片`,
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: '上传失败',
      description: (error as Error).message || '无法上传图片',
      color: 'error'
    })
  } finally {
    uploading.value = false
    if (input) input.value = ''
  }
}

// 删除图片
function removePhoto(index: number) {
  formData.value.photos?.splice(index, 1)
}

// 保存数据 (在模板中使用 @click="saveData")
async function saveData() {
  if (!formData.value.name.trim()) {
    toast.add({ title: t('admin.tra.inputError'), description: t('admin.tra.enterName'), color: 'error' })
    return
  }
  if (!formData.value.time.trim()) {
    toast.add({ title: t('admin.tra.inputError'), description: t('admin.tra.enterTime'), color: 'error' })
    return
  }

  saving.value = true
  try {
    const response = await $fetch<Result<TravelCity[]>>('/api/travel/records')
    let data: TravelCity[] = []

    if (response.success && response.data) {
      data = Array.isArray(response.data) ? response.data : []
    }

    if (isEditMode.value && editIndex.value >= 0) {
      data[editIndex.value] = { ...formData.value }
    } else {
      data.push({ ...formData.value })
    }

    await $fetch('/api/travel/records', {
      method: 'POST',
      body: { data: JSON.stringify(data), visible: true }
    })

    toast.add({ title: t('admin.tra.saveSuccess'), description: t('admin.tra.updated'), color: 'success' })

    setTimeout(() => {
      navigateTo('/admin/travel')
    }, 500)
  } catch (error: unknown) {
    toast.add({ title: t('admin.tra.saveFailed'), description: (error as Error).message || t('admin.tra.saveError'), color: 'error' })
  } finally {
    saving.value = false
  }
}

// 取消编辑 (在模板中使用 @click="cancel")
function cancel() {
  navigateTo(localePath('/admin/travel'))
}

// 页面加载时初始化
onMounted(async () => {
  await loadData()
  await initMap()
})

// 清理函数
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<template>
  <div class="h-full w-full overflow-y-auto">
    <div class="container mx-auto p-6 max-w-6xl">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold">
                {{ pageTitle }}
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ t('admin.tra.fillInfo') }}
              </p>
            </div>
            <UButton
              variant="ghost"
              @click="cancel"
            >
              {{ t('admin.tra.back') }}
            </UButton>
          </div>
        </template>

        <div class="space-y-6">
          <div class="space-y-4">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ t('admin.tra.basicInfo') }}
            </h3>

            <UFormField
              :label="t('admin.tra.locationName')"
              required
              class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4"
            >
              <UInput
                v-model="formData.name"
                :placeholder="t('admin.tra.locationPlaceholder')"
                class="w-full"
                @input="updateMapMarker"
              />
            </UFormField>

            <UFormField
              :label="t('admin.tra.travelTime')"
              required
              class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4"
            >
              <UInput
                v-model="formData.time"
                :placeholder="t('admin.tra.timePlaceholder')"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="t('admin.tra.travelDesc')"
              class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-start gap-4"
            >
              <UTextarea
                v-model="formData.description"
                :rows="4"
                :placeholder="t('admin.tra.descPlaceholder')"
                class="w-full"
              />
            </UFormField>

            <UFormField
              :label="t('admin.tra.articleLink')"
              class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4"
            >
              <UInput
                v-model="formData.articleLink"
                :placeholder="t('admin.tra.linkPlaceholder')"
                class="w-full"
              />
            </UFormField>
          </div>

          <USeparator />

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ t('admin.tra.locationSelect') }}
              </h3>

              <UButton
                v-if="mapHistory.length > 1"
                icon="i-lucide-arrow-left"
                variant="outline"
                color="neutral"
                @click="goBackToChina"
              >
                {{ t('admin.tra.backToPrev') }}
              </UButton>
            </div>

            <UAlert
              icon="i-lucide-info"
              color="primary"
              variant="soft"
              :title="t('admin.tra.usageGuide')"
              :description="t('admin.tra.drillGuide')"
            />

            <div class="w-full">
              <div
                class="relative w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                style="height: 512px;"
              >
                <div
                  v-if="mapLoading"
                  class="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800"
                >
                  <div class="text-center">
                    <div class="loading-spinner mx-auto mb-2" />
                    <p class="text-sm text-gray-500">
                      {{ t('admin.tra.loadingMap') }}
                    </p>
                  </div>
                </div>

                <div
                  ref="chartContainer"
                  class="w-full h-full"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormField
                :label="t('admin.tra.longitude')"
                required
                class="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-center gap-4"
              >
                <UInput
                  v-model.number="formData.value[0]"
                  type="number"
                  step="0.000001"
                  placeholder="116.4074"
                  class="w-full"
                  @change="onCoordinateChange"
                />
              </UFormField>

              <UFormField
                :label="t('admin.tra.latitude')"
                required
                class="grid grid-cols-1 sm:grid-cols-[100px_1fr] items-center gap-4"
              >
                <UInput
                  v-model.number="formData.value[1]"
                  type="number"
                  step="0.000001"
                  placeholder="39.9042"
                  class="w-full"
                  @change="onCoordinateChange"
                />
              </UFormField>
            </div>
          </div>

          <USeparator />

          <div class="space-y-4">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ t('admin.tra.travelPhotos') }}
            </h3>

            <UFormField
              :label="t('admin.tra.photos')"
              :description="t('admin.tra.photoGuide')"
              class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-start gap-4"
            >
              <div class="w-full space-y-4">
                <div v-if="formData.photos && formData.photos.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    v-for="(photo, index) in formData.photos"
                    :key="photo"
                    class="relative group"
                  >
                    <img
                      :src="photo"
                      loading="lazy"
                      class="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                    <UButton
                      icon="i-lucide-x"
                      size="xs"
                      color="error"
                      variant="solid"
                      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      @click="removePhoto(index)"
                    />
                  </div>
                </div>

                <div>
                  <input
                    ref="fileRef"
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden"
                    @change="uploadImage"
                  >
                  <UButton
                    icon="i-lucide-upload"
                    color="neutral"
                    :loading="uploading"
                    @click="onFileClick"
                  >
                    {{ t('admin.tra.uploadPhotos') }}
                  </UButton>
                </div>
              </div>
            </UFormField>
          </div>

          <USeparator />

          <div class="flex justify-end gap-3 pt-2">
            <UButton
              variant="outline"
              @click="cancel"
            >
              {{ t('admin.tra.cancel') }}
            </UButton>
            <UButton
              color="primary"
              :loading="saving"
              @click="saveData"
            >
              {{ t('admin.tra.save') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
