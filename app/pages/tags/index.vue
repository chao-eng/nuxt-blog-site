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
const { data: tagsData, pending } = await useAsyncData(
  'tags-all',
  async () => {
    const data: Result<[{ tag: string, count: number }]> = await $fetch('/api/blogs/tags')

    if (!data.success) {
      console.error('获取标签列表失败:', data.err)
      return []
    }

    return data.data || []
  }
)

const tags = computed(() => tagsData.value || [])

// 计算总文章数
const totalArticles = computed(() => {
  return tags.value.reduce((sum, tag) => sum + tag.count, 0)
})

// 按文章数量排序
const sortedTags = computed(() => {
  return [...tags.value].sort((a, b) => b.count - a.count)
})

// 获取标签大小级别
const getTagSizeClass = (count: number) => {
  if (tags.value.length === 0) return 'level-1'
  const counts = tags.value.map(t => t.count)
  const max = Math.max(...counts)
  const min = Math.min(...counts)
  const range = max - min || 1
  const ratio = (count - min) / range
  
  if (ratio > 0.8) return 'level-5'
  if (ratio > 0.6) return 'level-4'
  if (ratio > 0.4) return 'level-3'
  if (ratio > 0.2) return 'level-2'
  return 'level-1'
}

useHead({
  title: `${tagsPage.title} | ${t('blog.allTags')}`,
  meta: [
    {
      name: 'description',
      content: tagsPage.description
    }
  ]
})
</script>

<template>
  <div class="tags-explorer-premium animate-page-entrance">
    <!-- 全局背景装饰 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-primary-500/5 blur-[120px] rounded-full animate-pulse-slow" />
      <div class="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse-slow" style="animation-delay: 3s" />
    </div>

    <UContainer class="py-16 relative z-10 max-w-6xl">
      <!-- 页面头部 -->
      <header class="mb-20 text-center space-y-6">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/5 border border-primary-500/10 mb-4 animate-bounce-subtle">
          <UIcon name="i-lucide-tags" class="text-primary-500 w-4 h-4" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] text-primary-600 dark:text-primary-400">
            Topic Explorer
          </span>
        </div>

        <h1 class="tags-hero-title">
          {{ tagsPage.title }}
        </h1>
        
        <p class="text-lg text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto leading-relaxed">
          {{ t('blog.exploreTags', { count: tags.length, total: totalArticles }) }}
        </p>

        <!-- 汇总统计 -->
        <div class="flex justify-center gap-8 pt-4">
          <div class="flex flex-col items-center">
            <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Tags</span>
            <span class="text-2xl font-black text-gray-900 dark:text-white">{{ tags.length }}</span>
          </div>
          <div class="w-px h-10 bg-gray-200 dark:bg-gray-800" />
          <div class="flex flex-col items-center">
            <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Articles</span>
            <span class="text-2xl font-black text-gray-900 dark:text-white">{{ totalArticles }}</span>
          </div>
        </div>
      </header>

      <!-- 标签云网格 -->
      <div v-if="pending" class="py-32 flex flex-col items-center justify-center space-y-6">
        <div class="loading-spinner-premium" />
        <span class="text-xs font-black uppercase tracking-[0.4em] text-gray-400 animate-pulse">Mapping Knowledge Base...</span>
      </div>

      <div v-else-if="sortedTags.length > 0" class="tags-grid">
        <div
          v-for="(tagItem, index) in sortedTags"
          :key="tagItem.tag"
          class="stagger-item"
          :style="{ '--index': index }"
        >
          <NuxtLink
            :to="localePath('/tags/' + tagItem.tag)"
            class="tag-luxury-card group"
            :class="getTagSizeClass(tagItem.count)"
          >
            <div class="card-glass-content">
              <!-- 装饰背景 -->
              <div class="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-4">
                  <div class="tag-icon-box">
                    <UIcon name="i-lucide-hash" class="w-5 h-5 text-primary-500" />
                  </div>
                  <div class="flex flex-col">
                    <h3 class="tag-label">
                      {{ tagItem.tag }}
                    </h3>
                    <span class="tag-meta">
                      {{ tagItem.count }} {{ $t('blog.articles') }}
                    </span>
                  </div>
                </div>
                
                <div class="go-button opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                  <UIcon name="i-lucide-arrow-right" class="w-5 h-5 text-primary-500" />
                </div>
              </div>
            </div>
            
            <!-- 悬浮光影 -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </NuxtLink>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="py-32 text-center">
        <div class="mb-8 relative inline-block">
          <div class="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full" />
          <UIcon name="i-lucide-tag-off" class="text-8xl text-gray-200 dark:text-gray-800 relative z-10" />
        </div>
        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3 uppercase tracking-tight">
          {{ t('blog.noTags') }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium">
          {{ t('blog.noTagsDesc') }}
        </p>
      </div>
    </UContainer>
  </div>
</template>

<style scoped>
.tags-explorer-premium {
  min-height: 100vh;
}

/* 进场动画 */
@keyframes pageEntrance {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-page-entrance {
  animation: pageEntrance 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

/* 标题视觉 */
.tags-hero-title {
  font-size: 4rem;
  font-weight: 950;
  line-height: 1.1;
  letter-spacing: -0.06em;
  color: #0f172a;
}
.dark .tags-hero-title {
  color: #f8fafc;
  text-shadow: 0 10px 40px rgba(0,0,0,0.5);
}

@media (max-width: 640px) {
  .tags-hero-title { font-size: 2.75rem; }
}

/* 网格布局 */
.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}

/* 卡片样式 */
.tag-luxury-card {
  position: relative;
  display: block;
  background: white;
  border-radius: 2rem;
  border: 1px solid #f1f5f9;
  overflow: hidden;
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

.dark .tag-luxury-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border-color: rgba(255, 255, 255, 0.05);
}

.card-glass-content {
  position: relative;
  z-index: 10;
  padding: 1.5rem;
  display: flex;
  height: 100%;
}

.tag-luxury-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 30px 60px -12px rgba(99, 102, 241, 0.15);
}

.dark .tag-luxury-card:hover {
  border-color: rgba(129, 140, 248, 0.3);
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.5);
}

/* 标签大小分级 */
.level-5 .tag-label { font-size: 1.5rem; font-weight: 900; }
.level-4 .tag-label { font-size: 1.25rem; font-weight: 800; }
.level-3 .tag-label { font-size: 1.125rem; font-weight: 800; }
.level-2 .tag-label { font-size: 1rem; font-weight: 700; }
.level-1 .tag-label { font-size: 0.9375rem; font-weight: 700; }

.tag-label {
  color: #1e293b;
  line-height: 1.2;
  transition: color 0.3s;
}
.dark .tag-label { color: #f1f5f9; }
.tag-luxury-card:hover .tag-label { color: #6366f1; }

.tag-meta {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.tag-icon-box {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 1rem;
  transition: all 0.3s;
}
.dark .tag-icon-box { background: rgba(99, 102, 241, 0.1); }

.tag-luxury-card:hover .tag-icon-box {
  transform: rotate(15deg);
  background: #6366f1;
}
.tag-luxury-card:hover .tag-icon-box i,
.tag-luxury-card:hover .tag-icon-box .w-5 {
  color: white !important;
}

/* 加载动画 */
.loading-spinner-premium {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(99, 102, 241, 0.1);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

/* Stagger 逐行入场 */
.stagger-item {
  opacity: 0;
  animation: itemSlideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: calc(var(--index) * 0.04s + 0.3s);
}

@keyframes itemSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 微动 */
@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce-subtle {
  animation: bounceSubtle 3s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulseExtraSlow 8s ease-in-out infinite;
}
@keyframes pulseExtraSlow {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.15); opacity: 0.6; }
}
</style>
