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
  published?: boolean
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

// 格式化日期：更现代的简洁格式
const formatDate = (dateString: string) => {
  if (!dateString || dateString === 'no-date') return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>

<template>
  <article class="premium-archive-card group">
    <NuxtLink :to="path" class="relative flex flex-col sm:flex-row gap-6 p-6 lg:p-8">
      <!-- 封面图：极简容器 -->
      <div class="card-image-wrapper flex-shrink-0">
        <div class="image-inner">
          <img
            :src="image && image !== '' ? image : '/not-found.webp'"
            :alt="alt"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          >
          <!-- 悬浮遮罩 -->
          <div class="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <!-- 内容区 -->
      <div class="flex-1 min-w-0 flex flex-col justify-between">
        <div class="space-y-3">
          <!-- 顶部元数据 -->
          <div class="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <time :itemprop="formatDate(date)" class="flex items-center gap-1.5">
              <UIcon name="i-lucide-calendar" class="w-3 h-3" />
              {{ formatDate(date) }}
            </time>
            <span v-if="isSticky" class="flex items-center gap-1 text-orange-500">
              <UIcon name="i-lucide-pin" class="w-3 h-3" />
              TOP
            </span>
          </div>

          <!-- 标题：高对比度 -->
          <h2 class="card-title group-hover:text-primary-500 transition-colors">
            {{ title }}
          </h2>

          <!-- 描述 -->
          <p class="card-description">
            {{ description }}
          </p>
        </div>

        <!-- 标签流 -->
        <div v-if="tags.length > 0" class="mt-6 flex flex-wrap gap-2">
          <span
            v-for="tag in tags.slice(0, 4)"
            :key="tag"
            class="mini-tag"
          >
            #{{ tag }}
          </span>
          <span v-if="tags.length > 4" class="text-[10px] font-bold text-gray-300">
            +{{ tags.length - 4 }}
          </span>
        </div>
      </div>

      <!-- 右侧装饰箭头：仅在大屏幕显现 -->
      <div class="hidden lg:flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        <UIcon name="i-lucide-arrow-right" class="text-primary-500 w-6 h-6" />
      </div>
    </NuxtLink>
  </article>
</template>

<style scoped>
.premium-archive-card {
  position: relative;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.premium-archive-card:hover {
  background: rgba(99, 102, 241, 0.02);
}

.dark .premium-archive-card:hover {
  background: rgba(255, 255, 255, 0.01);
}

/* 图片容器 */
.card-image-wrapper {
  width: 100%;
  max-width: 180px;
}

@media (max-width: 639px) {
  .card-image-wrapper { max-width: 100%; height: 160px; }
}

.image-inner {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 1rem;
  overflow: hidden;
  background: #f1f5f9;
  border: 1px solid #f1f5f9;
}

@media (max-width: 639px) {
  .image-inner { height: 100%; }
}

.dark .image-inner {
  background: #0f172a;
  border-color: rgba(255, 255, 255, 0.05);
}

/* 标题 */
.card-title {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.3;
  color: #1e293b;
  letter-spacing: -0.02em;
}
.dark .card-title { color: #f1f5f9; }

/* 描述 */
.card-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 500;
}
.dark .card-description { color: #94a3b8; }

/* 标签 */
.mini-tag {
  font-size: 0.625rem;
  font-weight: 800;
  color: #94a3b8;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  background: #f8fafc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.3s;
}

.dark .mini-tag {
  background: rgba(255,255,255,0.03);
  color: #64748b;
}

.premium-archive-card:hover .mini-tag {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}
</style>
