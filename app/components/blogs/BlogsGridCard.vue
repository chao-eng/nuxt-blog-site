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
  isSticky: false
})

const formatDate = (dateString: string) => {
  if (!dateString || dateString === 'no-date') return '暂无日期'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

// 显示前3个标签
const displayTags = computed(() => props.tags.slice(0, 3))
</script>

<template>
  <article class="blog-card-modern group">
    <NuxtLink :to="path" class="card-link">
      <!-- 封面图区域 -->
      <div class="card-image-wrapper">
        <div class="card-image-container">
          <img
            :src="image || '/not-found.webp'"
            :alt="alt"
            class="card-image"
            loading="lazy"
          >
          <!-- 渐变遮罩 -->
          <div class="card-image-overlay" />
        </div>
        
        <!-- 置顶标识 -->
        <div v-if="isSticky" class="sticky-badge">
          <Icon name="i-lucide-pin" class="w-3 h-3" />
          <span class="text-xs font-medium">置顶</span>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="card-content">
        <!-- 标题 -->
        <h3 class="card-title">
          {{ title }}
        </h3>
        
        <!-- 描述 -->
        <p v-if="description && description !== 'no-description'" class="card-description">
          {{ description }}
        </p>

        <!-- 标签 -->
        <div v-if="displayTags.length > 0" class="card-tags">
          <span
            v-for="tag in displayTags"
            :key="tag"
            class="card-tag"
          >
            #{{ tag }}
          </span>
        </div>

        <!-- 底部信息 -->
        <div class="card-footer">
          <div class="card-date">
            <Icon name="i-lucide-calendar-days" class="w-3.5 h-3.5" />
            <span>{{ formatDate(date) }}</span>
          </div>
          
          <!-- 阅读更多指示器 -->
          <div class="read-more-indicator">
            <span class="text-xs font-medium">阅读</span>
            <Icon name="i-lucide-arrow-right" class="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      <!-- 悬停时的光效 -->
      <div class="card-glow" />
    </NuxtLink>
  </article>
</template>

<style scoped>
/* ===== 卡片容器 ===== */
.blog-card-modern {
  position: relative;
  height: 100%;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-link {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.dark .card-link {
  background: rgba(39, 39, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.blog-card-modern:hover .card-link {
  transform: translateY(-6px);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.2);
}

.dark .blog-card-modern:hover .card-link {
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 8px 10px -6px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(129, 140, 248, 0.2);
  border-color: rgba(129, 140, 248, 0.3);
}

/* ===== 封面图区域 ===== */
.card-image-wrapper {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%);
}

.dark .card-image-wrapper {
  background: linear-gradient(135deg, #27272a 0%, #18181b 100%);
}

.card-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.blog-card-modern:hover .card-image {
  transform: scale(1.08);
}

.card-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.blog-card-modern:hover .card-image-overlay {
  opacity: 1;
}

/* ===== 置顶标识 ===== */
.sticky-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 193, 7, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 0.5rem;
  color: rgba(0, 0, 0, 0.8);
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* ===== 内容区域 ===== */
.card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1.25rem;
  gap: 0.75rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
  color: rgb(24, 24, 27);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s ease;
}

.dark .card-title {
  color: rgb(250, 250, 250);
}

.blog-card-modern:hover .card-title {
  color: #6366F1;
}

.dark .blog-card-modern:hover .card-title {
  color: #818CF8;
}

.card-description {
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgb(113, 113, 122);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark .card-description {
  color: rgb(161, 161, 170);
}

/* ===== 标签 ===== */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #4F46E5;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.dark .card-tag {
  color: #818CF8;
  background: rgba(129, 140, 248, 0.1);
  border-color: rgba(129, 140, 248, 0.2);
}

.blog-card-modern:hover .card-tag {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

.dark .blog-card-modern:hover .card-tag {
  background: rgba(129, 140, 248, 0.15);
  border-color: rgba(129, 140, 248, 0.3);
}

/* ===== 底部信息 ===== */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.dark .card-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.card-date {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: rgb(113, 113, 122);
}

.dark .card-date {
  color: rgb(161, 161, 170);
}

.read-more-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6366F1;
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .read-more-indicator {
  color: #818CF8;
}

.blog-card-modern:hover .read-more-indicator {
  opacity: 1;
  transform: translateX(0);
}

/* ===== 光效 ===== */
.card-glow {
  position: absolute;
  inset: -1px;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.1),
    rgba(79, 70, 229, 0.1)
  );
  border-radius: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: -1;
}

.blog-card-modern:hover .card-glow {
  opacity: 1;
}
</style>
