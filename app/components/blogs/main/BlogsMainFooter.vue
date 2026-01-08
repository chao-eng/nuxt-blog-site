<script setup lang="ts">
import { useFooterData, useSeoData, useSocialLinks } from '../../../data'

// 定义 footerData 的类型
interface FooterData {
  author?: string
  authorInterest?: string
  aboutTheSite?: string
}

const { t } = useI18n()
const footerData = useFooterData()
const seoData = useSeoData()
const socialLinks = useSocialLinks()

const typedFooterData = computed(() => footerData as FooterData)

const route = useRoute()
const path = computed(() => route.fullPath.replace('/', ''))

// 添加安全检查
const safeFooterData = computed(() => typedFooterData.value || {})
const safeSeoData = computed(() => seoData || {})
const safeSocialLinks = computed(() => socialLinks || [])

// 社交链接配置
const socialItems = computed(() => {
  if (Array.isArray(safeSocialLinks.value)) {
    return safeSocialLinks.value
  }
  return []
})

const localePath = useLocalePath()

// 导航链接
const navLinks = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.articles'), to: localePath('/blogs') },
  { label: t('nav.tags'), to: localePath('/tags') },
  { label: t('nav.about'), to: localePath('/about') }
])

// 时间范围选择
const selectedRange = ref('7d')
const rangeOptions = computed(() => [
  { value: '24h', label: t('footer.range24h') },
  { value: '7d', label: t('footer.range7d') },
  { value: '30d', label: t('footer.range30d') },
  { value: '90d', label: t('footer.range90d') }
])

// 获取 Umami 统计数据
// useFetch 会自动监听 computed query 的变化并重新请求，无需手动 watch
const { data: umamiStats } = await useFetch<any>('/api/umami/stats', {
  lazy: true,
  server: false,
  query: computed(() => ({ range: selectedRange.value }))
})
</script>

<template>
  <footer class=" border-t border-gray-200/20 dark:border-gray-700/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm mt-auto">
    <UContainer class="max-w-6xl py-6">
      <!-- 主要内容区 -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <!-- 左侧信息 -->
        <div class="flex-1">
          <div v-if="path !== 'about'" class="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white text-sm">
                {{ safeFooterData.author || '加载中...' }}
              </h4>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {{ safeFooterData.authorInterest || '' }}
              </p>
            </div>
            <!-- 社交图标 -->
            <div v-if="socialItems.length" class="flex items-center gap-1">
              <UTooltip
                v-for="social in socialItems"
                :key="social.label"
                :text="social.label"
                :popper="{ placement: 'top' }"
              >
                <UButton
                  :to="social.to"
                  target="_blank"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  square
                  class="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <UIcon :name="social.icon" class="w-4 h-4" />
                </UButton>
              </UTooltip>
            </div>
          </div>
          <div v-else>
            <h4 class="font-semibold text-gray-900 dark:text-white text-sm mb-1.5">
              {{ t('footer.aboutSite') }}
            </h4>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              {{ safeFooterData.aboutTheSite || '' }}
            </p>
          </div>
        </div>

        <!-- 右侧导航和联系 -->
        <div class="flex items-center gap-6 text-sm">
          <nav class="flex items-center gap-4">
            <ULink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-xs"
            >
              {{ link.label }}
            </ULink>
          </nav>

          <UButton
            v-if="safeSeoData.mailAddress"
            :to="`mailto:${safeSeoData.mailAddress}`"
            color="primary"
            variant="ghost"
            size="xs"
            class="hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            {{ t('footer.contact') }}
          </UButton>
        </div>
      </div>

      <!-- 统计信息 -->
      <div v-if="umamiStats?.success && umamiStats?.data" class="mt-4 pt-4 border-t border-gray-200/20 dark:border-gray-700/30 flex flex-col items-center gap-3">
        <!-- 时间范围选择器 -->
        <div class="flex items-center gap-1.5">
          <UButton
            v-for="option in rangeOptions"
            :key="option.value"
            :variant="selectedRange === option.value ? 'soft' : 'ghost'"
            :color="selectedRange === option.value ? 'primary' : 'neutral'"
            size="xs"
            class="text-xs"
            @click="selectedRange = option.value"
          >
            {{ option.label }}
          </UButton>
        </div>

        <!-- 统计数据 -->
        <div class="flex flex-wrap justify-center items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-users" class="w-3.5 h-3.5" />
            <span>{{ t('footer.visitors') }}: {{ umamiStats.data.visitors }}</span>
          </div>
          <div class="w-px h-3 bg-gray-300 dark:bg-gray-600" />

          <!-- 访问次数 -->
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-mouse-pointer-click" class="w-3.5 h-3.5" />
            <span>{{ t('footer.visits') }}: {{ umamiStats.data.visits }}</span>
          </div>
          <div class="w-px h-3 bg-gray-300 dark:bg-gray-600" />

          <!-- 总浏览量 -->
          <div class="flex items-center gap-1.5">
            <UIcon name="i-lucide-eye" class="w-3.5 h-3.5" />
            <span>{{ t('footer.views') }}: {{ umamiStats.data.pageViews }}</span>
          </div>
        </div>
        <p class="text-center text-xs text-gray-500 dark:text-gray-400">
          {{ t('footer.copyright') }}
        </p>
      </div>
      <div v-else class="mt-4 pt-4 border-t border-gray-200/20 dark:border-gray-700/30">
        <p class="text-center text-xs text-gray-500 dark:text-gray-400">
          {{ t('footer.copyright') }}
        </p>
      </div>
    </UContainer>
  </footer>
</template>
