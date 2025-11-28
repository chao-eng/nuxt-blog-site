<script lang="ts" setup>
import type { BlogPost } from '~/types/blog'
import type { Article, Result } from '../../../types'

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

// 获取博客数据
const { data: blogData } = await useAsyncData('recent-blogs', async () => {
  try {
    const response: Result<{ list: Article[], total: number }> = await $fetch('/api/blogs/recent')

    if (!response.success || !response.data) {
      console.error('获取最近文章失败:', response.err)
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

// 错误处理
onMounted(() => {
  if (!blogData.value?.blogPosts.length) {
    const toast = useToast()
    toast.add({
      title: '获取最近文章失败',
      description: '请刷新页面重试',
      color: 'error'
    })
  }
})

// 响应式数据
const blogPosts = computed(() => blogData.value?.blogPosts || [])
const articles = computed(() => blogData.value?.articles || [])
</script>

<template>
  <div class="pb-10 px-4 ">
    <header class="flex items-center gap-2 pt-5 pb-2">
      <UIcon name="i-lucide-clock" class="text-2xl text-primary" />
      <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
    </header>

    <div v-if="blogPosts.length" class="space-y-4">
      <div
        v-for="(post, index) in blogPosts"
        :key="`blog-${index}-${post.to}`"
        class="group cursor-pointer card-animation "
        :style="{ animationDelay: `${index * 100}ms` }"
        @click="navigateTo(post.to)"
      >
        <div class="bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30 dark:bg-none bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border-2 border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 relative">
          <!-- 置顶标识 -->
          <div v-if="articles[index]?.isSticky" class="absolute top-2 right-2 z-10">
            <UIcon name="i-lucide-pin" class="text-orange-500 w-4 h-4" />
          </div>

          <div class="flex flex-col md:flex-row">
            <!-- 图片区域 - 左侧 -->
            <div v-if="post.image" class="md:w-48 flex-shrink-0 p-2">
              <div class="aspect-[16/9] md:aspect-[4/3] md:h-full overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg">
                <img
                  :src="post.image"
                  :alt="post.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                >
              </div>
            </div>

            <!-- 内容区域 - 右侧 -->
            <div class="flex-1 p-4 flex flex-col">
              <!-- 顶部：日期 -->
              <div class="flex items-center justify-between mb-2">
                <time class="text-xs text-gray-500">{{ post.date }}</time>
              </div>

              <!-- 标题 -->
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-primary-600 transition-colors line-clamp-1">
                {{ post.title }}
              </h3>

              <!-- 描述 -->
              <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-1 mb-3 flex-1">
                {{ post.description }}
              </p>

              <!-- 底部：标签和查看按钮 -->
              <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
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
                <div class="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 text-xs font-medium ml-3">
                  <span>查看</span>
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UEmpty
      v-else
      icon="i-heroicons-document-text"
      description="暂时没有文章"
      class="py-20"
    />
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
