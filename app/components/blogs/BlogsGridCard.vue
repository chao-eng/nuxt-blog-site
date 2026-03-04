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
  border-radius: 1.25rem;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-link {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.25rem;
  overflow: hidden;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.dark .card-link {
  background: rgba(24, 24, 27, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.blog-card-modern:hover .card-link {
  transform: translateY(-8px) scale(1.01);
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
}

.dark .blog-card-modern:hover .card-link {
  background: rgba(39, 39, 42, 0.8);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(129, 140, 248, 0.25);
  border-color: rgba(129, 140, 248, 0.4);
}

/* ===== 封面图区域 ===== */
.card-image-wrapper {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.dark .card-image-wrapper {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
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
  transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.blog-card-modern:hover .card-image {
  transform: scale(1.12);
}

.card-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.02) 60%,
    rgba(0, 0, 0, 0.2) 100%
  );
  opacity: 0.6;
  transition: opacity 0.4s ease;
}

.blog-card-modern:hover .card-image-overlay {
  opacity: 0.4;
}

/* ===== 置顶标识 ===== */
.sticky-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  color: white;
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  box-shadow: 0 8px 16px -4px rgba(245, 158, 11, 0.4);
  z-index: 10;
  animation: badge-pulse 2s infinite;
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 8px 16px -4px rgba(245, 158, 11, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 12px 20px -4px rgba(245, 158, 11, 0.5); }
}

/* ===== 内容区域 ===== */
.card-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1.5rem;
  gap: 0.85rem;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.4;
  color: rgb(15, 23, 42);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  letter-spacing: -0.02em;
}

.dark .card-title {
  color: rgb(241, 245, 249);
}

.blog-card-modern:hover .card-title {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.card-description {
  font-size: 0.925rem;
  line-height: 1.6;
  color: rgb(71, 85, 105);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark .card-description {
  color: rgb(148, 163, 184);
}

/* ===== 标签 ===== */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.card-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 0.6rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .card-tag {
  color: #818cf8;
  background: rgba(129, 140, 248, 0.1);
}

.blog-card-modern:hover .card-tag {
  background: #6366f1;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

/* ===== 底部信息 ===== */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.dark .card-footer {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.card-date {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgb(100, 116, 139);
}

.dark .card-date {
  color: rgb(148, 163, 184);
}

.read-more-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #6366f1;
  font-weight: 700;
  opacity: 0;
  transform: translateX(-12px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .read-more-indicator {
  color: #818cf8;
}

.blog-card-modern:hover .read-more-indicator {
  opacity: 1;
  transform: translateX(0);
}

/* ===== 光效 ===== */
.card-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.2),
    rgba(168, 85, 247, 0.2)
  );
  border-radius: 1.25rem;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: -1;
  filter: blur(10px);
}

.blog-card-modern:hover .card-glow {
  opacity: 1;
}
</style>
