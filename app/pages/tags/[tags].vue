<script lang="ts" setup>
import type { Article, Result } from '../../types'

definePageMeta({
  layout: 'blog'
})

const { path } = useRoute()
const tag = path.split('/').pop()
const localePath = useLocalePath()
const { t } = useI18n()

// 响应式变量
const elementPerPage = ref(5)
const pageNumber = ref(1)

// 使用 useAsyncData 在服务端获取数据
const { data: blogsData } = await useAsyncData(
  `tag-articles-${tag}`,
  async () => {
    const query = {
      page: pageNumber.value,
      pageSize: elementPerPage.value,
      tag: decodeURIComponent(tag || '')
    }
    const res: Result<{ list: Article[], total: number }> = await $fetch('/api/blogs/all', { query })
    return res.data || { list: [], total: 0 }
  },
  {
    watch: [pageNumber, elementPerPage]
  }
)

// 格式化数据用于展示
const paginatedData = computed(() => {
  return (blogsData.value?.list || []).map((article) => {
    return {
      path: localePath('/blogs/' + article.path),
      title: article.title || 'no-title available',
      description: article.description || 'no-description available',
      image: article.image || '',
      alt: article.title || 'no alter data available',
      ogImage: article.image || '/not-found.jpg',
      date: article.date || 'not-date-available',
      tags: article.tags || [],
      published: article.published,

    }
  })
})

// 计算总页数
const totalPage = computed(() => {
  const total = blogsData.value?.total || 0
  return Math.ceil(total / elementPerPage.value)
})

// 每页显示数量选项
const pageSizeOptions = computed(() => [
  { label: `5 ${t('blog.itemsPerPage')}`, value: 5 },
  { label: `10 ${t('blog.itemsPerPage')}`, value: 10 },
  { label: `20 ${t('blog.itemsPerPage')}`, value: 20 },
  { label: `50 ${t('blog.itemsPerPage')}`, value: 50 }
])

// 统计信息计算属性
const tagStats = computed(() => {
  const total = blogsData.value?.total || 0
  return {
    total,
    showing: paginatedData.value.length
  }
})

// 处理分页变化
const handlePageChange = (page: number) => {
  pageNumber.value = page
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听每页数量变化，重置页码
watch(elementPerPage, () => {
  pageNumber.value = 1
})

useHead({
  title: `${decodeURIComponent(tag || '')} ${t('blog.tagArticles')}`,
  meta: [
    {
      name: 'description',
      content: t('blog.browseTagArticles', { tag: decodeURIComponent(tag || '') })
    }
  ]
})
</script>

<template>
  <main class="container max-w-5xl mx-auto text-zinc-600">
    <UContainer class="py-8">
      <!-- 标签页面标题区域 -->
      <div class="mb-8">
        <!-- 面包屑导航 -->
        <nav class="flex items-center gap-2 mb-4">
          <NuxtLink
            :to="localePath('/tags')"
            class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <UIcon name="i-heroicons-tag" class="w-4 h-4" />
            <span>{{ $t('blog.allTags') }}</span>
          </NuxtLink>
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ decodeURIComponent(tag || '') }}
          </span>
        </nav>

        <!-- 页面标题 -->
        <div class="flex items-center gap-3 mb-4">
          <UIcon name="i-heroicons-tag" class="text-3xl text-primary" />
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
            {{ decodeURIComponent(tag || '') }}
          </h1>
        </div>

        <p class="text-lg text-gray-600 dark:text-gray-400">
          {{ $t('blog.exploreTagArticles', { tag: decodeURIComponent(tag || '') }) }}
        </p>
      </div>

      <!-- 筛选控制区域 -->
      <!-- 筛选控制区域 -->
      <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div class="space-y-4">
          <!-- 第一行：统计信息和返回按钮 -->
          <div class="flex items-center justify-between">
            <!-- 左侧：当前标签信息 -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ $t('blog.currentTag') }}</span>
                <UBadge
                  variant="solid"
                  color="primary"
                  size="md"
                  class="font-semibold px-3 py-1"
                >
                  {{ decodeURIComponent(tag || '') }}
                </UBadge>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('blog.total') }} <span class="font-medium text-primary-600 dark:text-primary-400">{{ tagStats.total }}</span> {{ $t('blog.articles') }}
              </span>
            </div>

            <!-- 右侧：返回按钮 -->
            <NuxtLink :to="localePath('/tags')">
              <UButton
                variant="outline"
                color="neutral"
                icon="i-heroicons-arrow-left"
                class="hover:shadow-sm"
              >
                {{ $t('blog.returnAllTags') }}
              </UButton>
            </NuxtLink>
          </div>

          <!-- 第二行：每页数量选择 -->
          <div class="flex items-center justify-end">
            <div class="flex items-center gap-3">
              <label class="text-sm text-gray-600 dark:text-gray-400">{{ $t('blog.itemsPerPageLabel') }}</label>
              <USelectMenu
                v-model="elementPerPage"
                :items="pageSizeOptions"
                :search-input="false"
                value-key="value"
                label-key="label"
                size="md"
                class="min-w-[120px]"
                :ui="{
                  base: 'h-9 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-primary-500'
                }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 文章列表 -->
      <div class="space-y-6 mb-8">
        <template v-for="post in paginatedData" :key="post.path">
          <BlogsArchiveCard
            :path="post.path"
            :title="post.title"
            :date="post.date"
            :description="post.description"
            :image="post.image"
            :alt="post.alt"
            :tags="post.tags"
            :published="post.published"

          />
        </template>

        <!-- 无文章时显示 -->
        <div v-if="paginatedData.length === 0" class="text-center py-12">
          <UCard>
            <div class="flex flex-col items-center space-y-4">
              <UIcon
                name="i-heroicons-document-text"
                class="text-6xl text-gray-400 dark:text-gray-600"
              />
              <div class="space-y-2 text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ $t('blog.noArticlesInTag') }}
                </h3>
                <p class="text-gray-500 dark:text-gray-400">
                  {{ $t('blog.noArticlesInTagDesc', { tag: decodeURIComponent(tag || '') }) }}
                </p>
              </div>
              <NuxtLink :to="localePath('/tags')">
                <UButton
                  variant="soft"
                  color="primary"
                  icon="i-heroicons-arrow-left"
                >
                  {{ $t('blog.browseOtherTags') }}
                </UButton>
              </NuxtLink>
            </div>
          </UCard>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="totalPage > 1" class="flex justify-center">
        <UPagination
          :page="pageNumber"
          :total="blogsData?.total || 0"
          :items-per-page="elementPerPage"
          :sibling-count="1"
          show-edges
          @update:page="handlePageChange"
        />
      </div>

      <!-- 底部统计信息 -->
      <div v-if="paginatedData.length > 0" class="mt-8 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('blog.showing') }} {{ (pageNumber - 1) * elementPerPage + 1 }} {{ $t('blog.to') }}
          {{ Math.min(pageNumber * elementPerPage, blogsData?.total || 0) }} {{ $t('blog.items') }}
          （{{ $t('blog.total') }} {{ blogsData?.total || 0 }} {{ $t('blog.items') }}{{ $t('blog.articles') }}）
        </p>
      </div>
    </UContainer>
  </main>
</template>
