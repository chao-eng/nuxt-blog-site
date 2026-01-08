<script setup lang="ts">
import type { Result } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

const { t } = useI18n()
const localePath = useLocalePath()

const stats = ref([
  {
    label: t('admin.dash.totalArticles'),
    value: '0',
    icon: 'i-lucide-newspaper',
    color: 'primary'
  },
  {
    label: t('admin.dash.travelRecords'),
    value: '0',
    icon: 'i-lucide-map-pin',
    color: 'success'
  },
  {
    label: t('admin.dash.systemUptime'),
    value: t('nav.loading'),
    icon: 'i-lucide-activity',
    color: 'emerald'
  }
])

let serverStartTime = 0

// 格式化运行时间
const formatUptime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}${t('admin.dash.days')}${hours % 24}${t('admin.dash.hours')}`
  } else if (hours > 0) {
    return `${hours}${t('admin.dash.hours')}${minutes % 60}${t('admin.dash.minutes')}`
  } else if (minutes > 0) {
    return `${minutes}${t('admin.dash.minutes')}`
  } else {
    return `${seconds}${t('admin.dash.seconds')}`
  }
}

// 更新运行时间显示
const updateUptime = () => {
  if (serverStartTime > 0 && stats.value[2]) {
    const uptime = Date.now() - serverStartTime
    stats.value[2].value = formatUptime(uptime)
  }
}

// 加载统计数据
onMounted(async () => {
  // 获取服务器启动时间
  try {
    const uptimeRes = await $fetch<{ success: boolean, startTime: number }>('/api/system/uptime')
    if (uptimeRes.success) {
      serverStartTime = uptimeRes.startTime
      updateUptime()

      // 每分钟更新一次运行时间
      setInterval(updateUptime, 60000)
    }
  } catch (error) {
    console.error('Failed to load server uptime:', error)
    if (stats.value[2]) {
      stats.value[2].value = t('admin.dash.fetchFailed')
    }
  }

  try {
    // 获取文章总数
    const articlesRes = await $fetch<Result<{ total: number }>>('/api/blogs/all', {
      params: { page: 1, pageSize: 1 }
    })
    console.log('Articles response:', articlesRes)
    if (articlesRes.success && articlesRes.data?.total !== undefined && stats.value[0]) {
      stats.value[0].value = articlesRes.data.total.toString()
    }
  } catch (error) {
    console.error('Failed to load articles stats:', error)
  }

  try {
    // 获取旅行记录
    const travelRes = await $fetch<Result<unknown[]>>('/api/travel/records')
    if (travelRes.success && travelRes.data && stats.value[1]) {
      stats.value[1].value = Array.isArray(travelRes.data) ? travelRes.data.length.toString() : '0'
    }
  } catch (error) {
    console.error('Failed to load travel stats:', error)
  }
})
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar :title="t('admin.dash.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- 欢迎卡片 -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-layout-dashboard" class="w-6 h-6 text-primary" />
              <h1 class="text-2xl font-bold">
                {{ t('admin.dash.title') }}
              </h1>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-lg text-gray-700 dark:text-gray-300">
              {{ t('admin.dash.welcome') }} <span class="font-semibold text-primary">{{ t('admin.dash.blogName') }}</span> {{ t('admin.dash.adminSystem') }}
            </p>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('admin.dash.intro') }}
            </p>
          </div>
        </UCard>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UCard v-for="stat in stats" :key="stat.label">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ stat.label }}
                </p>
                <p class="text-2xl font-bold mt-1">
                  {{ stat.value }}
                </p>
              </div>
              <UIcon
                :name="stat.icon"
                class="w-12 h-12 opacity-20"
                :class="`text-${stat.color}-500`"
              />
            </div>
          </UCard>
        </div>

        <!-- 功能介绍 -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">
              {{ t('admin.dash.systemFeatures') }}
            </h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 文章管理 -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-newspaper" class="w-5 h-5 text-blue-500" />
                <h3 class="font-semibold">
                  {{ t('admin.dash.articleManagement') }}
                </h3>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-7">
                <li>• {{ t('admin.dash.featureMarkdown') }}</li>
                <li>• {{ t('admin.dash.featureMetadata') }}</li>
                <li>• {{ t('admin.dash.featureStatus') }}</li>
                <li>• {{ t('admin.dash.featureSticky') }}</li>
              </ul>
            </div>

            <!-- 旅行记录 -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-map-pin" class="w-5 h-5 text-green-500" />
                <h3 class="font-semibold">
                  {{ t('admin.dash.travelRecords') }}
                </h3>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-7">
                <li>• {{ t('admin.dash.featureMap') }}</li>
                <li>• {{ t('admin.dash.featureJson') }}</li>
                <li>• {{ t('admin.dash.featureVisibility') }}</li>
                <li>• {{ t('admin.dash.featureEcharts') }}</li>
              </ul>
            </div>

            <!-- 系统设置 -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-settings" class="w-5 h-5 text-purple-500" />
                <h3 class="font-semibold">
                  {{ t('admin.dash.systemSettings') }}
                </h3>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-7">
                <li>• {{ t('admin.dash.featureAccount') }}</li>
                <li>• {{ t('admin.dash.featurePassword') }}</li>
                <li>• {{ t('admin.dash.featureAvatar') }}</li>
                <li>• {{ t('admin.dash.featureProfile') }}</li>
              </ul>
            </div>

            <!-- 评论与统计 -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-message-square" class="w-5 h-5 text-orange-500" />
                <h3 class="font-semibold">
                  {{ t('admin.dash.commentsAndStats') }}
                </h3>
              </div>
              <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400 ml-7">
                <li>• {{ t('admin.dash.featureGiscus') }}</li>
                <li>• {{ t('admin.dash.featureUmami') }}</li>
                <li>• {{ t('admin.dash.featureConfig') }}</li>
                <li>• {{ t('admin.dash.featureRealtime') }}</li>
              </ul>
            </div>
          </div>
        </UCard>

        <!-- 技术栈 -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">
              {{ t('admin.dash.techStack') }}
            </h2>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UIcon name="i-logos-nuxt-icon" class="w-6 h-6" />
              <span class="font-medium">Nuxt 3</span>
            </div>
            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UIcon name="i-logos-vue" class="w-6 h-6" />
              <span class="font-medium">Vue 3</span>
            </div>
            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UIcon name="i-logos-typescript-icon" class="w-6 h-6" />
              <span class="font-medium">TypeScript</span>
            </div>
            <div class="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <UIcon name="i-simple-icons-sqlite" class="w-6 h-6 text-blue-500" />
              <span class="font-medium">SQLite</span>
            </div>
          </div>
        </UCard>

        <!-- 快速链接 -->
        <UCard>
          <template #header>
            <h2 class="text-xl font-semibold">
              {{ t('admin.dash.quickLinks') }}
            </h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <UButton
              :to="localePath('/admin/article')"
              variant="outline"
              size="lg"
              block
            >
              <template #leading>
                <UIcon name="i-lucide-newspaper" />
              </template>
              {{ t('admin.dash.articleManagement') }}
            </UButton>

            <UButton
              :to="localePath('/admin/travel')"
              variant="outline"
              size="lg"
              block
            >
              <template #leading>
                <UIcon name="i-lucide-map-pin" />
              </template>
              {{ t('admin.dash.travelRecords') }}
            </UButton>

            <UButton
              :to="localePath('/admin/settings')"
              variant="outline"
              size="lg"
              block
            >
              <template #leading>
                <UIcon name="i-lucide-settings" />
              </template>
              {{ t('admin.dash.systemSettings') }}
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
