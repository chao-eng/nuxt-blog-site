<script lang="ts" setup>
import type { Result } from '../../types'
import { useTagsPage } from '~/data'
import { useHead } from 'nuxt/app'

const localePath = useLocalePath()
const { t } = useI18n()
definePageMeta({
  layout: 'blog'
})

const tagsPage = useTagsPage()

// 使用 useAsyncData 在服务端获取数据
const { data: tagsData } = await useAsyncData(
  'tags-all',
  async () => {
    const data: Result<[{ tag: string, count: number }]> = await $fetch('/api/blogs/tags')

    if (!data.success) {
      // 服务端错误处理
      console.error('获取标签列表失败:', data.err)
      return []
    }

    return data.data || []
  }
)

const tags = tagsData.value || []

// 计算总文章数
const totalArticles = computed(() => {
  return tags.reduce((sum, tag) => sum + tag.count, 0)
})

// 按文章数量排序
const sortedTags = computed(() => {
  return [...tags].sort((a, b) => b.count - a.count)
})

useHead({
  title: tagsPage.title,
  meta: [
    {
      name: 'description',
      content: tagsPage.description
    }
  ]
})
</script>

<template>
  <UContainer class="py-8">
    <!-- 页面标题 -->
    <div class="flex flex-col items-center text-center mb-10">
      <div class="flex items-center gap-3 mb-4">
        <UIcon name="i-heroicons-tag" class="text-3xl text-primary" />
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
          {{ tagsPage.title }}
        </h1>
      </div>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
        {{ $t('blog.exploreTags', { count: tags.length, total: totalArticles }) }}
      </p>
    </div>

    <!-- 标签网格 -->
    <div class="bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30 dark:bg-none bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-5xl mx-auto">
      <div v-if="sortedTags.length > 0" class="p-6">
        <TransitionGroup
          appear
          name="list"
          tag="div"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <NuxtLink
            v-for="(tagItem, index) in sortedTags"
            :key="tagItem.tag"
            :to="localePath('/tags/'+tagItem.tag)"
            class="block"
            :style="{ '--i': index }"
          >
            <div class="h-full p-6 flex flex-col items-center justify-center text-center space-y-3 border border-gray-100 dark:border-gray-700 rounded-lg hover:border-primary-200 dark:hover:border-primary-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 group">
              <!-- 标签名称 -->
              <h3 class="text-lg font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                #{{ tagItem.tag }}
              </h3>

              <!-- 文章数量 -->
              <div class="text-sm text-gray-500 dark:text-gray-400 group-hover:text-primary-500/80 dark:group-hover:text-primary-400/80 transition-colors">
                {{ tagItem.count }} {{ $t('blog.articles') }}
              </div>
            </div>
          </NuxtLink>
        </TransitionGroup>
      </div>

      <!-- 空状态 -->
      <UEmpty
        v-else
        icon="i-heroicons-tag"
        :title="$t('blog.noTags')"
        :description="$t('blog.noTagsDesc')"
        class="py-20"
      />

      <!-- 底部统计信息 -->
      <div v-if="sortedTags.length > 0" class="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
        <div class="flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-tag" class="w-4 h-4" />
            <span class="font-medium">{{ tags.length }}</span>
            <span>{{ $t('blog.tagsCount') }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
            <span class="font-medium">{{ totalArticles }}</span>
            <span>{{ $t('blog.articles') }}</span>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

<style scoped>
.list-enter-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.list-enter-active {
  transition-delay: calc(var(--i) * 0.03s);
}
</style>
