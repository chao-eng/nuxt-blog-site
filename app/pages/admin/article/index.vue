<script setup lang="ts">
import { ref } from 'vue'
import type { Article, Result } from '~/types'
import ArticleContent from '~/components/article/ArticleContent.vue'

const { t } = useI18n()

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

const articleLst = ref([] as Article[])
const selectedArticle = ref<Article | null>()

// 新增文章相关状态
const isCreateModalOpen = ref(false)
const newArticlePath = ref('')
const createError = ref('')
const isCreating = ref(false)

// 使用 useFetch 的 refresh 功能
const { data, refresh } = await useFetch<Result<Article[]>>('/api/article/articles')
articleLst.value = data.value?.data || []

// 打开新增文章弹窗
const openCreateModal = () => {
  newArticlePath.value = ''
  createError.value = ''
  isCreating.value = false
  isCreateModalOpen.value = true
}

// 关闭新增文章弹窗
const closeCreateModal = () => {
  isCreateModalOpen.value = false
  newArticlePath.value = ''
  createError.value = ''
  isCreating.value = false
}

// 验证文章路径
const validatePath = () => {
  const trimmedPath = newArticlePath.value.trim()

  if (!trimmedPath) {
    createError.value = t('admin.art.pathEmpty')
    return false
  }

  if (trimmedPath.length < 2) {
    createError.value = t('admin.art.pathTooShort')
    return false
  }

  // 检查路径是否已存在
  const exists = articleLst.value.some(article => article.path === trimmedPath)
  if (exists) {
    createError.value = t('admin.art.pathExists')
    return false
  }

  createError.value = ''
  return true
}

// 创建新文章
const createArticle = async () => {
  if (!validatePath()) return

  isCreating.value = true

  try {
    const trimmedPath = newArticlePath.value.trim()

    const newArticle: Article = {
      path: trimmedPath,
      title: trimmedPath, // 使用路径作为默认标题
      date: new Date().toISOString(),
      description: null,
      image: null,
      tags: [],
      published: false,
      content: '',
      modifyTime: new Date().toISOString(),
      isSaved: false,
      author: '',
      avatar: '',
      newBlog: true
    }

    // 模拟创建延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    // 添加到列表顶部
    articleLst.value.unshift(newArticle)
    selectedArticle.value = newArticle

    // 成功提示
    const toast = useToast()
    toast.add({
      title: t('admin.art.createSuccess'),
      description: t('admin.art.articleCreated', { path: trimmedPath }),
      color: 'success'
    })

    closeCreateModal()
  } catch (error) {
    console.error('创建文章失败:', error)
    createError.value = t('admin.art.createFailed')
  } finally {
    isCreating.value = false
  }
}

const refreshArticle = async () => {
  // 使用 useFetch 返回的 refresh 方法
  await refresh()
  articleLst.value = data.value?.data || []
}

const rebuildIndex = async () => {
  const toast = useToast()
  try {
    const res: any = await $fetch('/api/article/rebuild', { method: 'POST' })
    if (res.success) {
      toast.add({ title: t('admin.art.success'), description: res.message, color: 'success' })
      refreshArticle()
    } else {
      toast.add({ title: t('admin.art.failed'), description: res.message, color: 'error' })
    }
  } catch (e: any) {
    toast.add({ title: t('admin.art.error'), description: e.message, color: 'error' })
  }
}

// 清除错误信息
watch(newArticlePath, () => {
  if (createError.value) createError.value = ''
})
</script>

<template>
  <!-- 可调整大小的仪表盘面板 -->
  <UDashboardPanel
    id="article-1"
    :default-size="25"
    :min-size="20"
    :max-size="30"
    resizable
  >
    <UDashboardNavbar :title="t('admin.art.title')">
      <!-- 左侧插槽：侧边栏折叠按钮 -->
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>

      <template #right>
        <UTooltip :text="t('admin.art.rebuildIndex')">
          <UButton
            icon="i-lucide-database-backup"
            color="neutral"
            variant="ghost"
            @click="rebuildIndex"
          />
        </UTooltip>
        <UTooltip :text="t('admin.art.refreshList')">
          <UButton
            icon="i-lucide-refresh-ccw"
            color="neutral"
            variant="ghost"
            @click="refreshArticle"
          />
        </UTooltip>
        <UTooltip :text="t('admin.art.newArticle')">
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            @click="openCreateModal"
          />
        </UTooltip>
      </template>
    </UDashboardNavbar>

    <!-- 文章列表组件 -->
    <ArticleList v-model="selectedArticle" :articles="articleLst" />
  </UDashboardPanel>

  <!-- 文章详情组件 -->
  <ArticleContent v-if="selectedArticle" :article="selectedArticle" @close="selectedArticle = null" />
  <div v-else class="hidden lg:flex flex-1 items-center justify-center">
    <UIcon name="i-lucide-inbox" class="size-32 text-dimmed" />
  </div>

  <!-- 新增文章 Modal -->
  <UModal
    :open="isCreateModalOpen"
    :title="t('admin.art.newArticle')"
    :description="t('admin.art.setPath')"
  >
    <template #content>
      <div class="p-8 space-y-6">
        <!-- 标题区域 -->
        <div class="text-center space-y-2">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ t('admin.art.createNew') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('admin.art.setPath') }}
          </p>
        </div>

        <!-- 输入区域 - 修改为一行布局 -->
        <div class="space-y-4">
          <div class="space-y-3">
            <!-- 标签和输入框放在一行 -->
            <div class="flex items-center gap-4">
              <label class="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {{ t('admin.art.articlePath') }}
                <span class="text-red-500">*</span>
              </label>

              <div class="relative flex-1">
                <UInput
                  ref="pathInputRef"
                  v-model="newArticlePath"
                  class="transition-all duration-200 w-full"
                  :class="{
                    'ring-red-500 border-red-500 focus:ring-red-500': createError,
                    'ring-green-500 border-green-500': newArticlePath.trim() && !createError
                  }"
                  @keyup.enter="createArticle"
                  @keyup.escape="closeCreateModal"
                />
                <!-- 输入状态指示器 -->
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <UIcon
                    v-if="newArticlePath.trim() && !createError"
                    name="i-heroicons-check-circle"
                    class="w-5 h-5 text-green-500"
                  />
                </div>
              </div>
            </div>

            <!-- 规则提示 -->
            <div class="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p class="font-medium">
                  {{ t('admin.art.pathRules') }}
                </p>
                <ul class="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
                  <li>{{ t('admin.art.rule1') }}</li>
                  <li>{{ t('admin.art.rule2') }}</li>
                  <li>{{ t('admin.art.rule3') }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 错误提示 -->
          <div
            v-if="createError"
            class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-500" />
              <span class="text-sm font-medium text-red-800 dark:text-red-200">{{ createError }}</span>
            </div>
          </div>

          <!-- 成功预提示 -->
          <div
            v-if="newArticlePath.trim() && !createError"
            class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              <span class="text-sm text-green-800 dark:text-green-200">{{ t('admin.art.validPath') }}</span>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isCreating"
            class="flex-1 justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="closeCreateModal"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4 mr-2" />
            {{ t('admin.art.cancel') }}
          </UButton>
          <UButton
            :loading="isCreating"
            :disabled="!newArticlePath.trim() || !!createError"
            class="flex-1 justify-center bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
            @click="createArticle"
          >
            <UIcon v-if="!isCreating" name="i-heroicons-plus" class="w-4 h-4 mr-2" />
            {{ isCreating ? t('admin.art.creating') : t('admin.art.create') }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
