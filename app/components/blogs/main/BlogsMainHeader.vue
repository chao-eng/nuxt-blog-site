<script setup lang="ts">
import { computed } from 'vue'
import { useNavbarData } from '~/data'

const navbarData = useNavbarData()
const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()

const route = useRoute()

const navItems = computed(() => [
  { label: t('nav.articles'), to: localePath('/blogs') },
  { label: t('nav.tags'), to: localePath('/tags') },
  { label: t('nav.about'), to: localePath('/about') },
  { label: t('nav.admin'), to: localePath('/admin/travel') }
])

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
  <nav class="border-b border-gray-200/20 dark:border-gray-700/30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
    <UContainer class="max-w-6xl">
      <div class="flex justify-between items-center h-16">
        <ULink
          to="/"
          class="text-xl font-semibold tracking-tight"
          :class="isHomeActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'"
          :ui="{ base: 'transition-colors duration-150' }"
        >
          {{ navbarData.homeTitle }}
        </ULink>

        <div class="flex items-center gap-6">
          <div class="hidden md:flex items-center gap-1">
            <UButton
              v-for="item in navigationState"
              :key="item.to"
              :to="item.to"
              :variant="item.active ? 'soft' : 'ghost'"
              :color="item.active ? 'primary' : 'neutral'"
              size="sm"
              class="font-medium"
            >
              {{ item.label }}
            </UButton>
          </div>

          <div class="flex items-center gap-2">
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
              icon="i-lucide-languages"
              size="sm"
              variant="ghost"
              color="neutral"
              @click="toggleLocale"
            />
            <UColorModeButton size="sm" variant="ghost" color="neutral" />
          </div>
        </div>
      </div>
    </UContainer>
  </nav>
</template>
