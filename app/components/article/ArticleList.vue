<script setup lang="ts">
// 定义组件接收的props：父组件传递的邮件列表，类型为Mail数组
import type { Article } from '~/types'
import { format, isToday } from 'date-fns'

defineProps<{
  articles: Article[]
}>()
const selectedArticle = defineModel<Article | null>()
</script>

<template>
  <!-- 列表容器：允许垂直滚动，每个项之间添加分隔线 -->
  <div class="overflow-y-auto divide-y divide-default">
    <div
      v-for="(article, index) in articles"
      :key="article.path"
    >
      <div
        class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors"
        :class="[
          'text-highlighted',
          selectedArticle && selectedArticle.path === article.path
            ? 'border-primary bg-primary/10'
            : 'border-(--ui-bg) hover:border-primary hover:bg-primary/5'
        ]"
        @click="selectedArticle = article"
      >
        <div class="flex items-center justify-between font-semibold">
          <!-- 左侧：文章路径，限制宽度并截断 -->
          <div class="flex-1 min-w-0 mr-3">
            <div class="truncate">
              {{ article.path }}
            </div>
          </div>

          <!-- 右侧：警告图标和时间 -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <UTooltip text="元数据未保存">
              <UIcon
                v-if="!article.isSaved"
                name="i-lucide-triangle-alert"
                class="text-amber-500"
              />
            </UTooltip>

            <span class="text-xs text-gray-500">
              {{ isToday(new Date(article.modifyTime))
                ? format(new Date(article.modifyTime), 'HH:mm')
                : format(new Date(article.modifyTime), 'MM-dd')
              }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
