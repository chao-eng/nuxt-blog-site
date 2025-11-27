<script lang="ts" setup>
import type { BlogPost } from '~/types/blog'
import type { Article, Result } from '~/types'

// 统一的日期处理函数
const formatCustomDate = (dateStr: string): string => {
  const cleanDateStr = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1')
  const date = new Date(cleanDateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}

// 文章数据转换器
const transformArticles = (articles: Article[]): BlogPost[] =>
  articles.map((article) => {
    const post: BlogPost = {
      title: article.title || '',
      description: article.description || '',
      date: formatCustomDate(article.date),
      to: `/blogs/${article.path}`,
      tags: article.tags || [],
      image: null
    }

    // 只有有效图片才添加到对象中
    if (article.image && article.image !== '/not-found.jpg') {
      post.image = article.image
    }

    return post
  })

// 获取置顶博客数据
const { data: stickyData } = await useAsyncData('sticky-blogs', async () => {
  try {
    const response: Result<{ list: Article[], total: number }> = await $fetch('/api/blogs/sticky')

    if (!response.success || !response.data) {
      console.error('获取置顶文章失败:', response.err)
      return { articles: [], blogPosts: [], total: 0 }
    }

    const { list = [], total = 0 } = response.data
    return {
      articles: list,
      blogPosts: transformArticles(list),
      total
    }
  } catch (error) {
    console.error('API请求失败:', error)
    return { articles: [], blogPosts: [], total: 0 }
  }
})

// 响应式数据
const blogPosts = computed(() => stickyData.value?.blogPosts || [])
const articles = computed(() => stickyData.value?.articles || [])
</script>

<template>
  <div class="pb-10 px-4">
    <header class="flex items-center gap-3 pt-5 pb-6">
      <UIcon name="i-lucide-pin" class="text-3xl text-orange-500" />
            <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
    </header>

    <div v-if="blogPosts.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(post, index) in blogPosts"
        :key="`sticky-blog-${index}-${post.to}`"
        class="group cursor-pointer card-animation"
        :style="{ animationDelay: `${index * 100}ms` }"
        @click="navigateTo(post.to)"
      >
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1 border border-gray-100 dark:border-gray-700 relative">
          
          <!-- 头部区域 - 只有日期 -->
          <div class="p-6 pb-4">
            <div class="flex items-start  mb-4">
              <time class="text-sm text-gray-500">{{ post.date }}</time>
            </div>

            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight group-hover:text-orange-600 transition-colors">
              {{ post.title }}
            </h3>

            <p class="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
              {{ post.description }}
            </p>
          </div>

          <!-- 图片区域 -->
          <div v-if="post.image" class="px-6 pb-6">
            <div class="aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img
                :src="post.image"
                :alt="post.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              >
            </div>
          </div>

          <!-- 底部操作区域 - 所有标签都在这里 -->
          <div class="px-6 pb-6">
            <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
              <!-- 标签区域 -->
              <div class="flex flex-wrap gap-1.5">
                <UBadge
                  v-for="(tag) in articles[index]?.tags?.slice(0, 3)"
                  :key="tag"
                  :label="tag"
                  variant="soft"
                  size="xs"
                  class="tag-larger-text"
                />
              </div>

              <!-- 查看按钮 -->
              <div class="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm font-medium ml-4">
                <span>查看</span>
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-animation {
  opacity: 0; /* Start hidden */
  animation: slideIn 0.6s ease-out forwards;
}

/* 增大标签字体但保持标签区域大小 */
:deep(.tag-larger-text) {
  font-size: 0.75rem !important; /* text-sm */
  line-height: 1rem !important;
}
</style>
