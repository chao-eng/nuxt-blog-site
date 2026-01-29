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
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    label: t('admin.dash.travelRecords'),
    value: '0',
    icon: 'i-lucide-map-pin',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500'
  },
  {
    label: t('admin.dash.systemUptime'),
    value: t('nav.loading'),
    icon: 'i-lucide-activity',
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500'
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
      setInterval(updateUptime, 60000)
    }
  } catch (error) {
    console.error('Failed to load server uptime:', error)
    if (stats.value[2]) {
      stats.value[2].value = t('admin.dash.fetchFailed')
    }
  }

  try {
    const articlesRes = await $fetch<Result<{ total: number }>>('/api/blogs/all', {
      params: { page: 1, pageSize: 1 }
    })
    if (articlesRes.success && articlesRes.data?.total !== undefined && stats.value[0]) {
      stats.value[0].value = articlesRes.data.total.toString()
    }
  } catch (error) {
    console.error('Failed to load articles stats:', error)
  }

  try {
    const travelRes = await $fetch<Result<unknown[]>>('/api/travel/records')
    if (travelRes.success && travelRes.data && stats.value[1]) {
      stats.value[1].value = Array.isArray(travelRes.data) ? travelRes.data.length.toString() : '0'
    }
  } catch (error) {
    console.error('Failed to load travel stats:', error)
  }
})

// 功能特性
const features = [
  {
    icon: 'i-lucide-newspaper',
    title: t('admin.dash.articleManagement'),
    color: 'blue',
    items: [
      t('admin.dash.featureMarkdown'),
      t('admin.dash.featureMetadata'),
      t('admin.dash.featureStatus'),
      t('admin.dash.featureSticky')
    ]
  },
  {
    icon: 'i-lucide-map-pin',
    title: t('admin.dash.travelRecords'),
    color: 'green',
    items: [
      t('admin.dash.featureMap'),
      t('admin.dash.featureJson'),
      t('admin.dash.featureVisibility'),
      t('admin.dash.featureEcharts')
    ]
  },
  {
    icon: 'i-lucide-settings',
    title: t('admin.dash.systemSettings'),
    color: 'purple',
    items: [
      t('admin.dash.featureAccount'),
      t('admin.dash.featurePassword'),
      t('admin.dash.featureAvatar'),
      t('admin.dash.featureProfile')
    ]
  },
  {
    icon: 'i-lucide-message-square',
    title: t('admin.dash.commentsAndStats'),
    color: 'orange',
    items: [
      t('admin.dash.featureGiscus'),
      t('admin.dash.featureUmami'),
      t('admin.dash.featureConfig'),
      t('admin.dash.featureRealtime')
    ]
  }
]

// 技术栈
const techStack = [
  { icon: 'i-logos-nuxt-icon', name: 'Nuxt 3' },
  { icon: 'i-logos-vue', name: 'Vue 3' },
  { icon: 'i-logos-typescript-icon', name: 'TypeScript' },
  { icon: 'i-simple-icons-sqlite', name: 'SQLite', color: 'text-blue-500' }
]

// 快速链接
const quickLinks = [
  {
    to: localePath('/admin/article'),
    icon: 'i-lucide-newspaper',
    label: t('admin.dash.articleManagement'),
    color: 'indigo'
  },
  {
    to: localePath('/admin/travel'),
    icon: 'i-lucide-map-pin',
    label: t('admin.dash.travelRecords'),
    color: 'cyan'
  },
  {
    to: localePath('/admin/settings'),
    icon: 'i-lucide-settings',
    label: t('admin.dash.systemSettings'),
    color: 'purple'
  }
]
</script>

<template>
  <UDashboardPanel id="dashboard" class="admin-dashboard">
    <template #header>
      <UDashboardNavbar :title="t('admin.dash.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="dashboard-content">
        <!-- 欢迎横幅 -->
        <div class="welcome-banner">
          <div class="banner-content">
            <div class="banner-icon-wrapper">
              <Icon name="i-lucide-sparkles" class="banner-icon" />
            </div>
            <div class="banner-text">
              <h1 class="banner-title">
                {{ t('admin.dash.welcome') }} <span class="gradient-text">{{ t('admin.dash.blogName') }}</span>
              </h1>
              <p class="banner-description">
                {{ t('admin.dash.intro') }}
              </p>
            </div>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div
            v-for="(stat, index) in stats"
            :key="stat.label"
            class="stat-card"
            :style="{ '--i': index }"
          >
            <div class="stat-card-inner">
              <div class="stat-icon-wrapper" :class="`bg-gradient-to-br ${stat.gradient}`">
                <Icon :name="stat.icon" class="stat-icon" />
              </div>
              <div class="stat-content">
                <p class="stat-label">{{ stat.label }}</p>
                <p class="stat-value">{{ stat.value }}</p>
              </div>
            </div>
            <div class="stat-glow" :class="`bg-${stat.color}-500/20`" />
          </div>
        </div>

        <!-- 功能特性 -->
        <div class="features-section">
          <h2 class="section-title">
            <Icon name="i-lucide-zap" class="section-icon" />
            {{ t('admin.dash.systemFeatures') }}
          </h2>
          
          <div class="features-grid">
            <div
              v-for="(feature, index) in features"
              :key="feature.title"
              class="feature-card"
              :style="{ '--i': index }"
            >
              <div class="feature-header">
                <div class="feature-icon-wrapper">
                  <Icon :name="feature.icon" class="feature-icon" />
                </div>
                <h3 class="feature-title">{{ feature.title }}</h3>
              </div>
              <ul class="feature-list">
                <li v-for="item in feature.items" :key="item" class="feature-item">
                  <Icon name="i-lucide-check" class="check-icon" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 技术栈 -->
        <div class="tech-section">
          <h2 class="section-title">
            <Icon name="i-lucide-code-2" class="section-icon" />
            {{ t('admin.dash.techStack') }}
          </h2>
          
          <div class="tech-grid">
            <div
              v-for="(tech, index) in techStack"
              :key="tech.name"
              class="tech-card"
              :style="{ '--i': index }"
            >
              <Icon :name="tech.icon" class="tech-icon" :class="tech.color" />
              <span class="tech-name">{{ tech.name }}</span>
            </div>
          </div>
        </div>

        <!-- 快速链接 -->
        <div class="quick-links-section">
          <h2 class="section-title">
            <Icon name="i-lucide-rocket" class="section-icon" />
            {{ t('admin.dash.quickLinks') }}
          </h2>
          
          <div class="quick-links-grid">
            <NuxtLink
              v-for="(link, index) in quickLinks"
              :key="link.label"
              :to="link.to"
              class="quick-link-card"
              :style="{ '--i': index }"
            >
              <div class="quick-link-icon-wrapper">
                <Icon :name="link.icon" class="quick-link-icon" />
              </div>
              <span class="quick-link-label">{{ link.label }}</span>
              <Icon name="i-lucide-arrow-right" class="quick-link-arrow" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
/* ===== 仪表盘容器 ===== */
.admin-dashboard {
  min-height: 100vh;
}

.dashboard-content {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeIn 0.6s ease-out;
}

@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
    gap: 1.5rem;
  }
}

/* ===== 欢迎横幅 ===== */
.welcome-banner {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05));
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 1.5rem;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.dark .welcome-banner {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(129, 140, 248, 0.08));
  border-color: rgba(129, 140, 248, 0.2);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

@media (max-width: 640px) {
  .banner-content {
    flex-direction: column;
    text-align: center;
  }
}

.banner-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #6366F1, #818CF8);
  flex-shrink: 0;
}

.banner-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.banner-text {
  flex: 1;
}

.banner-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: rgb(24, 24, 27);
  margin-bottom: 0.5rem;
}

.dark .banner-title {
  color: rgb(250, 250, 250);
}

@media (max-width: 768px) {
  .banner-title {
    font-size: 1.5rem;
  }
}

.banner-description {
  font-size: 1rem;
  color: rgb(113, 113, 122);
}

.dark .banner-description {
  color: rgb(161, 161, 170);
}

/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  position: relative;
  border-radius: 1.25rem;
  overflow: hidden;
  animation: slideInUp 0.5s ease-out;
  animation-delay: calc(var(--i) * 0.1s);
  animation-fill-mode: both;
}

.stat-card-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.75rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.dark .stat-card-inner {
  background: rgba(39, 39, 42, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.stat-card:hover .stat-card-inner {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 1rem;
  flex-shrink: 0;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(113, 113, 122);
  margin-bottom: 0.5rem;
}

.dark .stat-label {
  color: rgb(161, 161, 170);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: rgb(24, 24, 27);
  line-height: 1;
}

.dark .stat-value {
  color: rgb(250, 250, 250);
}

.stat-glow {
  position: absolute;
  inset: -50%;
  filter: blur(40px);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.stat-card:hover .stat-glow {
  opacity: 1;
}

/* ===== 功能特性 ===== */
.features-section,
.tech-section,
.quick-links-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(24, 24, 27);
}

.dark .section-title {
  color: rgb(250, 250, 250);
}

.section-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: #6366F1;
}

.dark .section-icon {
  color: #818CF8;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  padding: 1.75rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 0.5s ease-out;
  animation-delay: calc(var(--i) * 0.1s);
  animation-fill-mode: both;
}

.dark .feature-card {
  background: rgba(39, 39, 42, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.feature-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05));
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.dark .feature-icon-wrapper {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(129, 140, 248, 0.08));
  border-color: rgba(129, 140, 248, 0.2);
}

.feature-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6366F1;
}

.dark .feature-icon {
  color: #818CF8;
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(24, 24, 27);
}

.dark .feature-title {
  color: rgb(250, 250, 250);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9375rem;
  color: rgb(63, 63, 70);
}

.dark .feature-item {
  color: rgb(212, 212, 216);
}

.check-icon {
  width: 1rem;
  height: 1rem;
  color: #6366F1;
  flex-shrink: 0;
}

.dark .check-icon {
  color: #818CF8;
}

/* ===== 技术栈 ===== */
.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.tech-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: scaleIn 0.4s ease-out;
  animation-delay: calc(var(--i) * 0.08s);
  animation-fill-mode: both;
}

.dark .tech-card {
  background: rgba(39, 39, 42, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
}

.tech-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.tech-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.tech-name {
  font-size: 1rem;
  font-weight: 500;
  color: rgb(24, 24, 27);
}

.dark .tech-name {
  color: rgb(250, 250, 250);
}

/* ===== 快速链接 ===== */
.quick-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.75rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1.25rem;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 0.5s ease-out;
  animation-delay: calc(var(--i) * 0.1s);
  animation-fill-mode: both;
}

.dark .quick-link-card {
  background: rgba(39, 39, 42, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.quick-link-card:hover {
  transform: translateX(8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

.quick-link-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.05));
  border: 1px solid rgba(99, 102, 241, 0.2);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.dark .quick-link-icon-wrapper {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(129, 140, 248, 0.08));
  border-color: rgba(129, 140, 248, 0.2);
}

.quick-link-card:hover .quick-link-icon-wrapper {
  transform: scale(1.1);
  background: linear-gradient(135deg, #6366F1, #818CF8);
  border-color: transparent;
}

.quick-link-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: #6366F1;
  transition: color 0.3s ease;
}

.dark .quick-link-icon {
  color: #818CF8;
}

.quick-link-card:hover .quick-link-icon {
  color: white;
}

.quick-link-label {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(24, 24, 27);
  transition: color 0.3s ease;
}

.dark .quick-link-label {
  color: rgb(250, 250, 250);
}

.quick-link-card:hover .quick-link-label {
  color: #6366F1;
}

.dark .quick-link-card:hover .quick-link-label {
  color: #818CF8;
}

.quick-link-arrow {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(161, 161, 170);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-link-card:hover .quick-link-arrow {
  opacity: 1;
  transform: translateX(0);
  color: #6366F1;
}

.dark .quick-link-card:hover .quick-link-arrow {
  color: #818CF8;
}
</style>
