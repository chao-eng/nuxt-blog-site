<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNavbarData } from '~/data'

const navbarData = useNavbarData()
const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const search = ref(route.query.search?.toString() || '')

// 监听路由参数变化，同步搜索框内容
watch(() => route.query.search, (newSearch) => {
  search.value = newSearch?.toString() || ''
})

const handleSearch = () => {
  navigateTo({
    path: localePath('/'),
    query: {
      ...route.query,
      search: search.value || undefined,
      page: 1
    }
  })
}

const { data: travelData } = await useFetch<{ success: boolean, visible: boolean }>('/api/travel/records')
const showTravel = computed(() => travelData.value?.success && travelData.value?.visible)

const navItems = computed(() => {
  const items = [
    { label: t('nav.articles'), to: localePath('/') },
    { label: t('nav.tags'), to: localePath('/tags') }
  ]

  if (showTravel.value) {
    items.push({ label: t('nav.travel'), to: localePath('/travel') })
  }

  items.push({ label: t('nav.about'), to: localePath('/about') })
  items.push({ label: t('nav.admin'), to: localePath('/admin/travel') })

  return items
})

const navigationState = computed(() => {
  return navItems.value.map(item => ({
    ...item,
    active: item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
  }))
})

const isHomeActive = computed(() => route.path === '/')

const toggleLocale = () => {
  setLocale(locale.value === 'en' ? 'zh-CN' : 'en')
}
</script>

<template>
  <nav class=" bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30 dark:bg-none border-b border-gray-200/20 dark:border-gray-700/30 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
    <UContainer class="max-w-6xl">
      <div class="flex justify-between items-center h-16 gap-4">
        <!-- Left: Logo & Navigation -->
        <div class="flex items-center gap-6 md:gap-8">
          <ULink
            to="/"
            class="text-xl font-semibold tracking-tight flex-shrink-0"
            :class="isHomeActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'"
            :ui="{ base: 'transition-colors duration-150' }"
          >
            {{ navbarData.homeTitle }}
          </ULink>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-1">
            <UButton
              v-for="item in navigationState"
              :key="item.to"
              :to="item.to"
              :variant="item.active ? 'soft' : 'ghost'"
              :color="item.active ? 'primary' : 'neutral'"
              size="md"
              class="font-medium transition-colors"
              :class="item.active ? 'font-semibold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
            >
              {{ item.label }}
            </UButton>
          </div>
        </div>

        <!-- Center: Search Bar -->
        <div class="flex-1 max-w-md hidden md:block">
          <UInput
            v-model="search"
            :placeholder="t('blog.searchPlaceholder')"
            :ui="{
              base: 'w-full h-9  border-0 focus:ring-2 focus:ring-primary-500 rounded-full transition-all duration-200',
              trailing: 'pe-1'
            }"
            class="w-full"
            @keydown.enter="handleSearch"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                icon="i-lucide-search"
                :padded="false"
                @click="handleSearch"
              />
            </template>
          </UInput>
        </div>

        <!-- Right: Actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Mobile Menu Items (Simplified) -->
          <template v-for="item in navigationState" :key="`mobile-${item.to}`">
            <UButton
              :to="item.to"
              :variant="item.active ? 'soft' : 'ghost'"
              :color="item.active ? 'primary' : 'neutral'"
              size="sm"
              class="font-medium text-sm md:hidden w-8 h-8 p-0"
            >
              {{ item.label.charAt(0) }}
            </UButton>
          </template>
          <UButton
            icon="i-simple-icons-github"
            size="sm"
            variant="ghost"
            color="neutral"
            to="https://github.com/chao-eng/nuxt-blog-site"
            target="_blank"
          />
          <UButton
            icon="i-lucide-languages"
            size="sm"
            variant="ghost"
            color="neutral"
            @click="toggleLocale"
          />
          <UColorModeButton size="sm" variant="ghost" color="neutral" />
        </div>
      </div>
    </UContainer>
  </nav>
</template>
