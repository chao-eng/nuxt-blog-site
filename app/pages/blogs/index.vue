<script lang="ts" setup>
import type { Article, Result } from '../../types'
import { useHead } from 'nuxt/app'
import { useBlogsPage } from '../../data'
const localePath = useLocalePath()
const { t } = useI18n()
const route = useRoute()

// 配置页面布局
definePageMeta({
  layout: 'blog'
})

const blogsPage = useBlogsPage()

// 响应式变量
const elementPerPage = ref(5)
const pageNumber = ref(1)

// 监听每页数量变化，重置页码
watch(elementPerPage, () => {
  pageNumber.value = 1
})

// 使用 useAsyncData 在服务端获取数据（支持分页和搜索）
const { data: blogsData, status } = await useAsyncData(
  'blogs-list',
  async () => {
    const query = {
      page: pageNumber.value,
      pageSize: elementPerPage.value,
      search: route.query.search?.toString() || ''
    }
    const res: Result<{ list: Article[], total: number }> = await $fetch('/api/blogs/all', { query })
    return res.data || { list: [], total: 0 }
  },
  {
    watch: [pageNumber, elementPerPage, () => route.query.search]
  }
)

// 格式化数据用于展示
const paginatedData = computed(() => {
  return (blogsData.value?.list || []).map((article) => {
    return {
      path: localePath('/blogs/' + article.path),
      title: article.title || 'no-title available',
      description: article.description || '',
      image: article.image || '',
      alt: article.title || '',
      date: article.date || 'not-date-available',
      tags: article.tags || [],
      published: article.published,
      isSticky: article.isSticky || false,

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

// 搜索状态计算属性
const searchStats = computed(() => {
  const total = blogsData.value?.total || 0
  const hasSearch = !!route.query.search

  return {
    total,
    filtered: total, // 服务端返回的已经是过滤后的总数
    hasSearch,
    showing: paginatedData.value.length
  }
})

// 清空搜索
const clearSearch = () => {
  navigateTo({
    path: localePath('/blogs'),
    query: {
      ...route.query,
      search: undefined,
      page: 1
    }
  })
}

// 处理分页变化
const handlePageChange = (page: number) => {
  pageNumber.value = page
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

useHead({
  title: blogsPage.title,
  meta: [
    {
      name: 'description',
      content: blogsPage.description
    }
  ]
})
</script>

<template>
  <main class="container max-w-5xl mx-auto text-zinc-600">
    <UContainer class="py-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- 统计与筛选栏 -->
        <div class="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span v-if="searchStats.hasSearch">
                {{ $t('blog.found') }} <span class="font-medium text-primary-600 dark:text-primary-400">{{ searchStats.filtered }}</span> {{ $t('blog.articles') }}
                （{{ $t('blog.total') }} {{ searchStats.total }} {{ $t('blog.piece') }}）
              </span>
              <span v-else>
                {{ $t('blog.total') }} <span class="font-medium text-primary-600 dark:text-primary-400">{{ searchStats.total }}</span> {{ $t('blog.articles') }}
              </span>
              <UBadge v-if="searchStats.hasSearch" variant="soft" color="primary" size="sm">
                {{ $t('blog.searchResults') }}
              </UBadge>
            </div>
            
            <!-- 每页数量选择 -->
            <USelectMenu
              v-model="elementPerPage"
              :items="pageSizeOptions"
              :search-input="false"
              value-key="value"
              label-key="label"
              size="md"
              class="min-w-[120px]"
              :ui="{
                base: 'h-9  border-0 focus:ring-2 focus:ring-primary-500'
              }"
            />
          </div>
        </div>

        <div class="mb-0">
          <TransitionGroup 
            appear
            name="list" 
            tag="div" 
            class=""
          >
            <template v-for="(post, index) in paginatedData" :key="post.path">
              <div :style="{ '--i': index }">
                <BlogsArchiveCard
                  :path="post.path"
                  :title="post.title"
                  :date="post.date"
                  :description="post.description"
                  :image="post.image"
                  :alt="post.alt"
                  :tags="post.tags"
                  :published="post.published"
                  :is-sticky="post.isSticky"

                />
              </div>
            </template>
          </TransitionGroup>

          <div v-if="paginatedData.length === 0" class="text-center py-12">
            <div class="flex flex-col items-center space-y-4">
              <UIcon
                name="i-lucide-search-x"
                class="text-6xl text-gray-400 dark:text-gray-600"
              />
              <div class="space-y-2 text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ searchStats.hasSearch ? $t('blog.noMatch') : $t('blog.noArticles') }}
                </h3>
                <p class="text-gray-500 dark:text-gray-400">
                  {{ searchStats.hasSearch ? $t('blog.tryModifySearch') : $t('blog.noPublishedArticles') }}
                </p>
              </div>
              <UButton
                v-if="searchStats.hasSearch"
                variant="soft"
                icon="i-lucide-rotate-ccw"
                @click="clearSearch"
              >
                {{ $t('blog.clearSearch') }}
              </UButton>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="totalPage > 1" class="flex justify-center py-6 border-t border-gray-100 dark:border-gray-800">
          <UPagination
            :page="pageNumber"
            :total="blogsData?.total || 0"
            :items-per-page="elementPerPage"
            :sibling-count="1"
            show-edges
            @update:page="handlePageChange"
          />
        </div>
      </div>

      <div v-if="paginatedData.length > 0" class="mt-8 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('blog.showing') }} {{ (pageNumber - 1) * elementPerPage + 1 }} {{ $t('blog.to') }}
          {{ Math.min(pageNumber * elementPerPage, blogsData?.total || 0) }} {{ $t('blog.items') }}
          （{{ $t('blog.total') }} {{ blogsData?.total || 0 }} {{ $t('blog.items') }}{{ searchStats.hasSearch ? $t('blog.searchResults') : '' }}）
        </p>
      </div>
    </UContainer>
  </main>
</template>

<style scoped>
.list-enter-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}
.list-enter-active {
  transition-delay: calc(var(--i) * 0.03s);
}
</style>
