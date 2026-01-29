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

// 获取标签大小（基于文章数量）
const getTagSize = (count: number) => {
  const max = Math.max(...tags.map(t => t.count))
  const min = Math.min(...tags.map(t => t.count))
  const ratio = (count - min) / (max - min || 1)
  
  if (ratio > 0.7) return 'xl'
  if (ratio > 0.4) return 'lg'
  if (ratio > 0.2) return 'md'
  return 'sm'
}

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
  <main class="deep-space-bg min-h-screen">
    <UContainer class="max-w-7xl py-12">
      <!-- 页面标题区域 -->
      <div class="tags-header">
        <div class="header-icon-wrapper">
          <Icon name="i-lucide-tags" class="header-icon" />
          <div class="icon-glow" />
        </div>
        
        <h1 class="header-title gradient-text">
          {{ tagsPage.title }}
        </h1>
        
        <p class="header-description">
          {{ t('blog.exploreTags', { count: tags.length, total: totalArticles }) }}
        </p>

        <!-- 统计卡片 -->
        <div class="stats-cards">
          <div class="stat-card">
            <Icon name="i-lucide-hash" class="stat-icon" />
            <div class="stat-content">
              <div class="stat-value">{{ tags.length }}</div>
              <div class="stat-label">{{ t('blog.tagsCount') }}</div>
            </div>
          </div>
          
          <div class="stat-card">
            <Icon name="i-lucide-file-text" class="stat-icon" />
            <div class="stat-content">
              <div class="stat-value">{{ totalArticles }}</div>
              <div class="stat-label">{{ t('blog.articles') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 标签云 -->
      <div v-if="sortedTags.length > 0" class="tags-cloud-container">
        <TransitionGroup
          appear
          name="tag-item"
          tag="div"
          class="tags-cloud"
        >
          <NuxtLink
            v-for="(tagItem, index) in sortedTags"
            :key="tagItem.tag"
            :to="localePath('/tags/' + tagItem.tag)"
            class="tag-card"
            :class="`tag-size-${getTagSize(tagItem.count)}`"
            :style="{ '--i': index }"
          >
            <div class="tag-card-inner">
              <!-- 标签图标 -->
              <div class="tag-icon-wrapper">
                <Icon name="i-lucide-hash" class="tag-icon" />
              </div>
              
              <!-- 标签内容 -->
              <div class="tag-content">
                <h3 class="tag-name">
                  {{ tagItem.tag }}
                </h3>
                <div class="tag-count">
                  <Icon name="i-lucide-file-text" class="count-icon" />
                  <span>{{ tagItem.count }}</span>
                </div>
              </div>

              <!-- 悬停效果 -->
              <div class="tag-hover-effect" />
              
              <!-- 箭头指示器 -->
              <div class="tag-arrow">
                <Icon name="i-lucide-arrow-right" class="arrow-icon" />
              </div>
            </div>
          </NuxtLink>
        </TransitionGroup>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-state-content">
          <div class="empty-icon-wrapper">
            <Icon name="i-lucide-tags" class="empty-icon" />
          </div>
          <div class="empty-text">
            <h3 class="empty-title">{{ t('blog.noTags') }}</h3>
            <p class="empty-description">{{ t('blog.noTagsDesc') }}</p>
          </div>
        </div>
      </div>
    </UContainer>
  </main>
</template>

<style scoped>
/* ===== 页面标题区域 ===== */
.tags-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 3rem;
  gap: 1.5rem;
}

.header-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 1.5rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.dark .header-icon-wrapper {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(99, 102, 241, 0.1));
  border-color: rgba(129, 140, 248, 0.2);
}

.header-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #6366F1;
  z-index: 1;
}

.dark .header-icon {
  color: #818CF8;
}

.icon-glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent 70%);
  filter: blur(20px);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.header-title {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .header-title {
    font-size: 2rem;
  }
}

.header-description {
  font-size: 1.125rem;
  line-height: 1.6;
  color: rgb(113, 113, 122);
  max-width: 42rem;
}

.dark .header-description {
  color: rgb(161, 161, 170);
}

/* ===== 统计卡片 ===== */
.stats-cards {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .stats-cards {
    flex-direction: column;
    width: 100%;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.dark .stat-card {
  background: rgba(39, 39, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  color: #6366F1;
}

.dark .stat-icon {
  color: #818CF8;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: rgb(24, 24, 27);
  line-height: 1;
}

.dark .stat-value {
  color: rgb(250, 250, 250);
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(113, 113, 122);
}

.dark .stat-label {
  color: rgb(161, 161, 170);
}

/* ===== 标签云容器 ===== */
.tags-cloud-container {
  position: relative;
}

.tags-cloud {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .tags-cloud {
    grid-template-columns: 1fr;
  }
}

/* ===== 标签卡片 ===== */
.tag-card {
  position: relative;
  display: block;
  text-decoration: none;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-card-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .tag-card-inner {
  background: rgba(39, 39, 42, 0.5);
  border-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.tag-card:hover .tag-card-inner {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(99, 102, 241, 0.1);
}

.dark .tag-card:hover .tag-card-inner {
  border-color: rgba(129, 140, 248, 0.3);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(129, 140, 248, 0.2);
}

/* 标签大小变体 */
.tag-size-xl .tag-card-inner {
  padding: 2rem;
}

.tag-size-xl .tag-name {
  font-size: 1.5rem;
}

.tag-size-lg .tag-name {
  font-size: 1.25rem;
}

.tag-size-md .tag-name {
  font-size: 1.125rem;
}

.tag-size-sm .tag-name {
  font-size: 1rem;
}

/* 标签图标 */
.tag-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.2);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.dark .tag-icon-wrapper {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(99, 102, 241, 0.1));
  border-color: rgba(129, 140, 248, 0.2);
}

.tag-card:hover .tag-icon-wrapper {
  transform: rotate(12deg) scale(1.1);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.2));
}

.tag-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6366F1;
}

.dark .tag-icon {
  color: #818CF8;
}

/* 标签内容 */
.tag-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tag-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(24, 24, 27);
  transition: color 0.2s ease;
}

.dark .tag-name {
  color: rgb(250, 250, 250);
}

.tag-card:hover .tag-name {
  color: #6366F1;
}

.dark .tag-card:hover .tag-name {
  color: #818CF8;
}

.tag-count {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: rgb(113, 113, 122);
}

.dark .tag-count {
  color: rgb(161, 161, 170);
}

.count-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* 悬停效果 */
.tag-hover-effect {
  position: absolute;
  inset: -1px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1));
  border-radius: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: -1;
}

.tag-card:hover .tag-hover-effect {
  opacity: 1;
}

/* 箭头指示器 */
.tag-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: rgba(99, 102, 241, 0.1);
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .tag-arrow {
  background: rgba(129, 140, 248, 0.1);
}

.tag-card:hover .tag-arrow {
  opacity: 1;
  transform: translateX(0);
}

.arrow-icon {
  width: 1rem;
  height: 1rem;
  color: #6366F1;
}

.dark .arrow-icon {
  color: #818CF8;
}

/* ===== 标签动画 ===== */
.tag-item-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.tag-item-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.tag-item-enter-active {
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
</style>
