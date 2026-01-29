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
const elementPerPage = ref(10)
const pageNumber = ref(1)

// 使用 useAsyncData 在服务端获取数据
const { data: blogsData, pending } = await useAsyncData(
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
      isSticky: article.isSticky ?? false
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

// 处理分页变化
const handlePageChange = (page: number) => {
  pageNumber.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(elementPerPage, () => {
  pageNumber.value = 1
})

useHead({
  title: `${decodeURIComponent(tag || '')} | ${t('blog.tagArticles')}`,
  meta: [
    {
      name: 'description',
      content: t('blog.browseTagArticles', { tag: decodeURIComponent(tag || '') })
    }
  ]
})
</script>

<template>
  <div class="tag-page-premium animate-page-entrance">
    <!-- 全局背景装饰 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary-500/5 blur-[120px] rounded-full animate-pulse-slow" />
      <div class="absolute bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse-slow" style="animation-delay: 3s" />
    </div>

    <UContainer class="py-12 relative z-10">
      <!-- 页面头部：简约而高级 -->
      <header class="mb-12">
        <nav class="flex items-center gap-2 mb-6 opacity-60 hover:opacity-100 transition-opacity">
          <NuxtLink
            :to="localePath('/tags')"
            class="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-1.5 hover:text-primary-500 transition-colors"
          >
            <UIcon name="i-lucide-tags" class="w-3.5 h-3.5" />
            {{ $t('blog.allTags') }}
          </NuxtLink>
          <span class="text-gray-300 dark:text-gray-700">/</span>
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">
            {{ decodeURIComponent(tag || '') }}
          </span>
        </nav>

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div class="space-y-2">
            <h1 class="tag-hero-title">
              <span class="text-primary-500 mr-2">#</span>{{ decodeURIComponent(tag || '') }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 font-medium max-w-2xl leading-relaxed">
              {{ $t('blog.exploreTagArticles', { tag: decodeURIComponent(tag || '') }) }}
            </p>
          </div>

          <div class="stats-card-mini">
            <div class="flex flex-col items-end">
              <span class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Articles</span>
              <span class="text-3xl font-black text-gray-900 dark:text-white leading-none">
                {{ blogsData?.total || 0 }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- 文章卡片容器：玻璃态阴影 -->
      <div class="glass-list-card overflow-hidden">
        <!-- 头部工具栏 -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span class="text-[11px] font-black uppercase tracking-widest text-gray-400">
              Latest Activity
            </span>
          </div>

          <div class="flex items-center gap-4">
            <USelectMenu
              v-model="elementPerPage"
              :items="pageSizeOptions"
              value-key="value"
              label-key="label"
              size="xs"
              class="w-32"
              :ui="{
                base: 'bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 rounded-lg shadow-sm'
              }"
            />
          </div>
        </div>

        <!-- 文章列表：带进场动画 -->
        <div class="divide-y divide-gray-100 dark:divide-gray-800/50 relative">
          <!-- 加载状态 -->
          <div v-if="pending" class="py-24 flex flex-col items-center justify-center space-y-4">
            <div class="loading-spinner-premium" />
            <span class="text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">Loading Articles...</span>
          </div>

          <template v-else-if="paginatedData.length > 0">
            <div
              v-for="(post, index) in paginatedData"
              :key="post.path"
              class="stagger-item"
              :style="{ '--index': index }"
            >
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

          <!-- 空状态 -->
          <div v-else class="py-24 text-center">
            <div class="mb-6 relative inline-block">
              <div class="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full" />
              <UIcon name="i-lucide-scroll-text" class="text-6xl text-gray-300 dark:text-gray-700 relative z-10" />
            </div>
            <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
              {{ $t('blog.noArticlesInTag') }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto mb-8 font-medium">
              {{ $t('blog.noArticlesInTagDesc', { tag: decodeURIComponent(tag || '') }) }}
            </p>
            <NuxtLink :to="localePath('/tags')">
              <UButton
                color="primary"
                variant="solid"
                icon="i-lucide-arrow-left"
                class="rounded-xl px-6 font-bold uppercase tracking-wider text-xs"
              >
                {{ $t('blog.browseOtherTags') }}
              </UButton>
            </NuxtLink>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="totalPage > 1" class="px-6 py-8 flex justify-center border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/30 dark:bg-black/10">
          <UPagination
            v-model="pageNumber"
            :total="blogsData?.total || 0"
            :page-count="elementPerPage"
            :sibling-count="1"
            show-edges
            @update:page="handlePageChange"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
.tag-page-premium {
  min-height: 100vh;
}

/* 进场动画 */
@keyframes pageEntrance {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-page-entrance {
  animation: pageEntrance 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

/* 标题视觉 */
.tag-hero-title {
  font-size: 3.5rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: -0.05em;
  color: #0f172a;
}
.dark .tag-hero-title {
  color: #f8fafc;
  text-shadow: 0 0 40px rgba(99, 102, 241, 0.1);
}

@media (max-width: 640px) {
  .tag-hero-title { font-size: 2.5rem; }
}

/* 统计卡片 */
.stats-card-mini {
  padding: 1.5rem 2rem;
  background: white;
  border-radius: 1.5rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
}
.dark .stats-card-mini {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
}

/* 列表容器 */
.glass-list-card {
  background: white;
  border-radius: 2.5rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 40px 80px -20px rgba(0,0,0,0.08);
}
.dark .glass-list-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(30px);
  border-color: rgba(255,255,255,0.05);
  box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5);
}

/* 逐行扫描进场动画 */
.stagger-item {
  opacity: 0;
  animation: itemSlideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: calc(var(--index) * 0.08s + 0.2s);
}

@keyframes itemSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 加载动画 */
.loading-spinner-premium {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(99, 102, 241, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

/* 脉冲背景 */
.animate-pulse-slow {
  animation: pulseExtraSlow 6s ease-in-out infinite;
}
@keyframes pulseExtraSlow {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}
</style>
