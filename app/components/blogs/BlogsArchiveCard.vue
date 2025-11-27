<script lang="ts" setup>
interface Props {
  path?: string
  title?: string
  date?: string
  description?: string
  image?: string
  alt?: string

  tags?: Array<string>
  isSticky?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  path: '/',
  title: 'no-title',
  date: 'no-date',
  description: 'no-description',
  image: '',
  alt: 'no-alt',
  tags: () => [],
  published: false,
  isSticky: false
})

// 格式化日期为相对时间
const formatDate = (dateString: string) => {
  if (!dateString || dateString === 'no-date') return '暂无日期'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (days < 365) return `${Math.floor(days / 30)}月前`

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

// 计算是否有有效图片
const hasImage = computed(() => {
  return props.image && props.image !== '' && props.image !== '/not-found.jpg'
})
</script>

<template>
  <article class="py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors duration-200 group">
    <NuxtLink :to="path" class="block">
      <!-- 主内容区域 -->
      <div class="flex gap-4 relative">
        <!-- 置顶标识 -->
        <div v-if="isSticky" class="absolute top-0 right-0 z-10">
          <UIcon name="i-lucide-pin" class="text-orange-500 w-4 h-4" />
        </div>

        <!-- 封面图 (移动到左侧) -->
        <div v-if="hasImage" class="flex-shrink-0">
          <div class="w-28 h-20 sm:w-32 sm:h-24 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              :src="image"
              :alt="alt"
              class="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
            >
          </div>
        </div>

        <!-- 文本内容区 -->
        <div class="flex-1 min-w-0">
          <!-- 标题 -->
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
            {{ title }}
          </h2>

          <!-- 描述摘要 -->
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-2">
            {{ description }}
          </p>

          <!-- 底部信息条 -->
          <div class="flex items-center gap-4">
            <!-- 日期 -->
            <time class="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{{ formatDate(date) }}</time>
            
            <!-- 标签 -->
            <div v-if="tags.length > 0" class="flex items-center gap-1.5">
              <UBadge
                v-for="(tag) in tags.slice(0, 3)"
                :key="tag"
                :label="tag"
                variant="soft"
                size="xs"
                class="tag-larger-text"
              />
              <span v-if="tags.length > 3" class="text-xs text-gray-400 ml-1">
                +{{ tags.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>

<style scoped>
/* 增大标签字体但保持标签区域大小 */
:deep(.tag-larger-text) {
  font-size: 0.75rem !important; /* text-sm */
  line-height: 1rem !important;
}
</style>
