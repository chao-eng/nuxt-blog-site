<script lang="ts" setup>
import type { Article, Result } from '../types'
import { useHead } from 'nuxt/app'
import { useBlogsPage } from '../data'

const localePath = useLocalePath()
const { t } = useI18n()
const route = useRoute()

// 配置页面布局
definePageMeta({
  layout: 'blog'
})

const blogsPage = useBlogsPage()

// 响应式变量
const elementPerPage = ref(16)
const pageNumber = ref(1)

// 监听每页数量变化，重置页码
watch(elementPerPage, () => {
  pageNumber.value = 1
})

// 使用 useAsyncData 在服务端获取数据（支持分页和搜索）
const { data: blogsData } = await useAsyncData(
  'blogs-list-home',
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
      isSticky: article.isSticky || false
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
  { label: `12 ${t('blog.itemsPerPage')}`, value: 12 },
  { label: `16 ${t('blog.itemsPerPage')}`, value: 16 },
  { label: `24 ${t('blog.itemsPerPage')}`, value: 24 },
  { label: `48 ${t('blog.itemsPerPage')}`, value: 48 }
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
    path: localePath('/'),
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
  <main class="deep-space-bg min-h-screen">
    <UContainer class="max-w-7xl py-8">
      <!-- 文章网格 -->
      <div class="blog-grid-container">
        <TransitionGroup
          appear
          name="blog-list"
          tag="div"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <template v-for="(post, index) in paginatedData" :key="post.path">
            <div :style="{ '--i': index }" class="h-full">
              <BlogsGridCard
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

        <!-- 空状态 -->
        <div v-if="paginatedData.length === 0" class="empty-state">
          <div class="empty-state-content">
            <div class="empty-icon-wrapper">
              <Icon
                :name="searchStats.hasSearch ? 'i-lucide-search-x' : 'i-lucide-file-text'"
                class="empty-icon"
              />
            </div>
            <div class="empty-text">
              <h3 class="empty-title">
                {{ searchStats.hasSearch ? $t('blog.noMatch') : $t('blog.noArticles') }}
              </h3>
              <p class="empty-description">
                {{ searchStats.hasSearch ? $t('blog.tryModifySearch') : $t('blog.noPublishedArticles') }}
              </p>
            </div>
            <UButton
              v-if="searchStats.hasSearch"
              variant="soft"
              color="primary"
              size="lg"
              icon="i-lucide-rotate-ccw"
              class="empty-action"
              @click="clearSearch"
            >
              {{ $t('blog.clearSearch') }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- 分页控件 -->
      <div v-if="totalPage > 1" class="pagination-wrapper">
        <UPagination
          :page="pageNumber"
          :total="blogsData?.total || 0"
          :items-per-page="elementPerPage"
          :sibling-count="1"
          show-edges
          class="pagination-modern"
          @update:page="handlePageChange"
        />
      </div>
    </UContainer>
  </main>
</template>

<style scoped>
/* ===== 博客网格容器 ===== */
.blog-grid-container {
  min-height: 60vh;
}

/* ===== 列表动画 ===== */
.blog-list-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.blog-list-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.blog-list-enter-active {
  transition-delay: calc(var(--i) * 0.05s);
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 3rem 1.5rem;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 28rem;
  text-align: center;
}

.empty-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.dark .empty-icon-wrapper {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(99, 102, 241, 0.1));
  border-color: rgba(129, 140, 248, 0.2);
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: #6366F1;
}

.dark .empty-icon {
  color: #818CF8;
}

.empty-text {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(24, 24, 27);
}

.dark .empty-title {
  color: rgb(250, 250, 250);
}

.empty-description {
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(113, 113, 122);
}

.dark .empty-description {
  color: rgb(161, 161, 170);
}

.empty-action {
  margin-top: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.empty-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* ===== 分页器 ===== */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.dark .pagination-wrapper {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.pagination-modern {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.dark .pagination-modern {
  background: rgba(39, 39, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>
