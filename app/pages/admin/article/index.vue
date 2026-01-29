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
      isSticky: false,
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
    const res = await $fetch<{ success: boolean, message: string }>('/api/article/rebuild', { method: 'POST' })
    if (res.success) {
      toast.add({ title: t('admin.art.success'), description: res.message, color: 'success' })
      refreshArticle()
    } else {
      toast.add({ title: t('admin.art.failed'), description: res.message, color: 'error' })
    }
  } catch (e: unknown) {
    toast.add({ title: t('admin.art.error'), description: (e as Error).message, color: 'error' })
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
    class="article-sidebar"
  >
    <UDashboardNavbar class="navbar-modern">
      <!-- 左侧插槽：侧边栏折叠按钮 -->
      <template #leading>
        <div class="flex items-center gap-2">
          <UDashboardSidebarCollapse />
          <div class="flex items-center gap-2.5 ml-1">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
               <UIcon name="i-lucide-library" class="w-4 h-4 text-indigo-500" />
            </div>
            <span class="text-base font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
              {{ t('admin.articles') }}
            </span>
          </div>
        </div>
      </template>

      <template #right>
        <div class="flex items-center gap-1.5 px-2">
          <UTooltip :text="t('admin.art.rebuildIndex')">
            <UButton
              icon="i-lucide-database-backup"
              color="neutral"
              variant="ghost"
              size="sm"
              class="toolbar-btn rounded-xl"
              @click="rebuildIndex"
            />
          </UTooltip>
          <UTooltip :text="t('admin.art.refreshList')">
            <UButton
              icon="i-lucide-refresh-ccw"
              color="neutral"
              variant="ghost"
              size="sm"
              class="toolbar-btn rounded-xl"
              @click="refreshArticle"
            />
          </UTooltip>
          <div class="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            size="sm"
            class="action-btn-glow rounded-xl px-3"
            @click="openCreateModal"
          />
        </div>
      </template>
    </UDashboardNavbar>

    <!-- 文章列表组件 -->
    <ArticleList v-model="selectedArticle" :articles="articleLst" class="article-list-container" />
  </UDashboardPanel>

  <!-- 文章详情组件 -->
  <ArticleContent v-if="selectedArticle" :article="selectedArticle" @close="selectedArticle = null" />
  <div v-else class="hidden lg:flex flex-1 items-center justify-center bg-gray-50/50 dark:bg-black/20">
    <div class="empty-state">
      <div class="empty-icon-pulse">
        <Icon name="i-lucide-scroll-text" class="w-12 h-12 text-primary-500/50" />
      </div>
      <p class="mt-4 text-sm text-gray-400 font-medium tracking-wider">{{ t('admin.art.selectToView') || '选择一篇文章开始编辑' }}</p>
    </div>
  </div>

  <!-- 新增文章 Modal -->
  <UModal
    v-model:open="isCreateModalOpen"
    :dismissible="false"
    :ui="{
      content: 'sm:max-w-lg overflow-hidden rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-gray-950/95'
    }"
  >
    <template #header>
      <div class="flex items-center gap-4 p-2">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 shadow-lg shadow-primary-500/5">
          <Icon name="i-lucide-file-plus-2" class="w-7 h-7 text-primary-500" />
        </div>
        <div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ t('admin.art.createNew') }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ t('admin.art.setPath') }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="modal-cyber-glow">
        <!-- 装饰背景 -->
        <div class="modal-bg-pattern" />

        <div class="space-y-6 relative z-10">
          <div class="form-group">
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
              {{ t('admin.art.articlePath') }}
            </label>
            <div class="relative group">
              <UInput
                ref="pathInputRef"
                v-model="newArticlePath"
                placeholder="example-article-path"
                size="xl"
                variant="none"
                class="cyber-input"
                :class="{ 'input-error': createError }"
                @keyup.enter="createArticle"
              />
              <div class="input-glow" />
            </div>
          </div>

          <!-- 规则卡片 -->
          <div class="rule-card">
            <div class="flex items-center gap-2 mb-3">
              <Icon name="i-lucide-shield-info" class="w-4 h-4 text-primary-500" />
              <span class="text-[10px] font-black text-primary-500 tracking-wider uppercase">{{ t('admin.art.pathRules') }}</span>
            </div>
            <ul class="space-y-2">
              <li v-for="i in [1,2,3]" :key="i" class="flex items-start gap-2">
                <Icon name="i-lucide-check-circle-2" class="w-3.5 h-3.5 text-green-500 mt-0.5" />
                <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ t(`admin.art.rule${i}`) }}</span>
              </li>
            </ul>
          </div>

          <!-- 错误区域 -->
          <Transition name="fade-slide">
            <div v-if="createError" class="error-alert">
              <Icon name="i-lucide-alert-circle" class="w-4 h-4" />
              <span class="font-bold">{{ createError }}</span>
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-4 w-full">
        <UButton
          color="neutral"
          variant="subtle"
          class="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest transition-all"
          @click="closeCreateModal"
        >
          {{ t('admin.art.cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="isCreating"
          :disabled="!newArticlePath.trim() || !!createError"
          class="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest action-btn-glow"
          @click="createArticle"
        >
          {{ isCreating ? t('admin.art.creating') : t('admin.art.create') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* ===== 布局与面板样式 ===== */
.article-sidebar {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .article-sidebar {
  background: rgba(10, 10, 15, 0.4);
  border-right-color: rgba(255, 255, 255, 0.05);
}

.navbar-modern {
  background: transparent !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.dark .navbar-modern {
  border-bottom-color: rgba(255, 255, 255, 0.05) !important;
}

/* ===== 按钮特效 ===== */
.toolbar-btn {
  transition: all 0.3s ease;
  opacity: 0.7;
}

.toolbar-btn:hover {
  opacity: 1;
  background: rgba(99, 102, 241, 0.1) !important;
  transform: translateY(-1px);
}

.action-btn-glow {
  background: linear-gradient(135deg, #6366f1, #a855f7) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.action-btn-glow:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.6) !important;
}

/* ===== 空状态动画 ===== */
.empty-state {
  text-align: center;
  animation: fadeIn 1s ease-out;
}

.empty-icon-pulse {
  display: inline-flex;
  padding: 2rem;
  border-radius: 3rem;
  background: rgba(99, 102, 241, 0.05);
  animation: pulse-glow 3s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

/* ===== Modal 极客样式 ===== */
.modal-cyber-glow {
  position: relative;
  overflow: hidden;
}

.modal-bg-pattern {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  filter: blur(20px);
  z-index: 0;
}

.cyber-input :deep(input) {
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1.5px solid rgba(0, 0, 0, 0.05);
  border-radius: 1rem;
  transition: all 0.3s ease;
}

.dark .cyber-input :deep(input) {
  background: rgba(15, 23, 42, 0.6) !important;
  border-color: rgba(255, 255, 255, 0.1);
}

.cyber-input:focus-within :deep(input) {
  border-color: #6366f1;
  background: white !important;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.rule-card {
  padding: 1.25rem;
  background: rgba(99, 102, 241, 0.03);
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 1rem;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(ef, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
  border-radius: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
}

/* 动画 */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
