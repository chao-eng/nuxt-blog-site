<template>
  <!-- 列表容器 -->
  <div class="article-list-scroll pt-2">
    <div
      v-for="article in articles"
      :key="article.path"
      class="px-3 mb-2"
    >
      <div
        class="article-card group"
        :class="[
          selectedArticle && selectedArticle.path === article.path ? 'card-active' : 'card-inactive'
        ]"
        @click="selectedArticle = article"
      >

        <div class="flex items-center gap-2 w-full min-w-0">
          <!-- 文章图标 -->
          <Icon 
            :name="article.published ? 'i-lucide-file-check' : 'i-lucide-file-edit'" 
            class="w-4 h-4 flex-shrink-0 transition-colors"
            :class="selectedArticle?.path === article.path ? 'text-white' : 'text-primary-500'"
          />
          
          <!-- 文章路径与短号组合 -->
          <div class="flex flex-col flex-1 min-w-0">
            <span class="text-sm font-bold truncate tracking-tight">
              {{ article.path }}
            </span>
            <span v-if="article.shortId" class="text-[9px] font-mono opacity-50 flex items-center gap-1 mt-0.5 uppercase">
              <UIcon name="i-lucide-link-2" class="w-2.5 h-2.5" />
              {{ article.shortId }}
            </span>
          </div>

          <!-- 状态标识 -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <UBadge 
              size="xs" 
              variant="subtle" 
              :color="article.published ? 'success' : 'warning'" 
              class="status-badge-mini"
            >
              {{ article.published ? t('admin.art.published') : t('admin.art.draft') }}
            </UBadge>
            
            <!-- 元数据告警 -->
            <UTooltip v-if="!article.isSaved" :text="t('admin.art.unsavedMetadata') || '元数据未保存'">
              <Icon name="i-lucide-alert-circle" class="w-3 h-3 text-amber-500 animate-pulse" />
            </UTooltip>
          </div>

          <!-- 时间 -->
          <span class="text-[10px] font-medium opacity-40 flex-shrink-0 uppercase tracking-tighter w-8 text-right">
            {{ isToday(new Date(article.modifyTime))
              ? format(new Date(article.modifyTime), 'HH:mm')
              : format(new Date(article.modifyTime), 'MM/dd')
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article } from '~/types'
import { format, isToday } from 'date-fns'

const { t } = useI18n()
defineProps<{
  articles: Article[]
}>()
const selectedArticle = defineModel<Article | null>()
</script>

<style scoped>
.article-list-scroll {
  height: calc(100vh - 4rem);
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 2rem;
}

/* 自定义滚动条 */
.article-list-scroll::-webkit-scrollbar {
  width: 4px;
}
.article-list-scroll::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.1);
  border-radius: 4px;
}

.article-card {
  position: relative;
  padding: 0.6rem 0.75rem 0.6rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  overflow: hidden;
}

.card-inactive {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(0, 0, 0, 0.02);
  color: #64748b;
}

.dark .card-inactive {
  background: rgba(15, 23, 42, 0.2);
  border-color: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
}

.card-inactive:hover {
  transform: translateX(4px);
  background: white;
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow: 4px 0 15px -5px rgba(99, 102, 241, 0.1);
  color: #1e293b;
}

.dark .card-inactive:hover {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(99, 102, 241, 0.3);
  color: white;
}

.card-active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px -2px rgba(99, 102, 241, 0.3);
  transform: translateX(4px);
  z-index: 10;
}


.status-online {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.status-offline {
  background: #f59e0b;
}

.card-active .status-indicator {
  width: 4px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: none;
}

.status-badge-mini {
  border-radius: 4px;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 8px;
  line-height: 1;
  padding: 2px 4px;
  letter-spacing: 0.02em;
}

.card-active .status-badge-mini {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: none;
}
</style>
