<template>
  <UDashboardPanel id="article-2" class="flex flex-col h-full">
    <UDashboardNavbar :toggle="false" class="">
      <template #leading>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          class="-ms-1.5 hover:rotate-90 transition-transform duration-200"
          @click="handleClose"
        />
      </template>

      <template #title>
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <UIcon name="i-lucide-file-text" class="w-4 h-4 text-white" />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <h1 v-if="metadata.title" class="text-lg font-semibold cursor-pointer hover:text-primary-600 truncate transition-colors duration-200">
              {{ metadata.title }}
            </h1>
            <h1 v-else class="text-lg font-semibold cursor-pointer hover:text-primary-600 truncate transition-colors duration-200">
              {{ article.path }}
            </h1>
          </div>
        </div>
      </template>

      <template #right>
        <div class="flex items-center gap-1">
          <UTooltip v-if="vditorInstance" :text="$t('admin.art.previewMode')">
            <UButton
              icon="i-lucide-eye"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="previewArticle()"
            />
          </UTooltip>
          <UTooltip v-if="!vditorInstance" :text="$t('admin.art.editMode')">
            <UButton
              icon="i-lucide-edit"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="editArticle()"
            />
          </UTooltip>

          <UTooltip :text="$t('admin.art.saveArticle')">
            <UButton
              icon="i-lucide-save"
              color="primary"
              variant="ghost"
              size="sm"
              :loading="isSaving"
              @click="saveArticle"
            />
          </UTooltip>

          <div class="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />

          <UTooltip :text="$t('admin.art.deleteArticle')">
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              @click="openDeleteModal"
            />
          </UTooltip>
        </div>
      </template>
    </UDashboardNavbar>

    <div v-if="vditorInstance" class="flex-shrink-0">
      <div class="metadata-console p-4">
        <div v-show="isMetadataVisible" class="mb-6 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 backdrop-blur-sm shadow-sm transition-all">
          <div class="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
            
            <!-- Title Row -->
            <div class="flex items-center group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
              <div class="w-24 md:w-32 shrink-0 px-4 py-3.5 text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider select-none">
                {{ $t('admin.art.title') }}
              </div>
              <div class="flex-1 px-2 py-1">
                <UInput
                  v-model="metadata.title"
                  :placeholder="$t('admin.art.titlePlaceholder')"
                  size="sm"
                  variant="none"
                  :ui="{ base: 'p-2 text-sm font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 bg-transparent focus:ring-0 shadow-none !text-left' }"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Date Row -->
            <div class="flex items-center group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
              <div class="w-24 md:w-32 shrink-0 px-4 py-3.5 text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider select-none">
                {{ $t('admin.art.date') }}
              </div>
              <div class="flex-1 px-2 py-1">
                <UInput
                  v-model="metadata.date"
                  type="datetime-local"
                  size="sm"
                  variant="none"
                  :ui="{ base: 'p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-transparent focus:ring-0 shadow-none !text-left' }"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Status Row -->
            <div class="flex items-center group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
              <div class="w-24 md:w-32 shrink-0 px-4 py-3.5 text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider select-none">
                {{ $t('admin.art.status') }}
              </div>
              <div class="flex-1 px-4 py-2 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                   <div class="relative flex h-2 w-2">
                      <span v-if="metadata.published" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2 w-2" :class="metadata.published ? 'bg-green-500' : 'bg-amber-500'"></span>
                   </div>
                   <span class="text-sm font-medium" :class="metadata.published ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                     {{ metadata.published ? $t('admin.art.published') : $t('admin.art.draft') }}
                   </span>
                </div>
                <USwitch
                  v-model="metadata.published"
                  size="md"
                  class="ml-auto"
                />
              </div>
            </div>

            <!-- Description Row -->
            <div class="flex group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
              <div class="w-24 md:w-32 shrink-0 px-4 py-3.5 text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider select-none pt-4">
                {{ $t('admin.art.description') }}
              </div>
              <div class="flex-1 px-2 py-1.5">
                <UTextarea
                  v-model="metadata.description"
                  :placeholder="$t('admin.art.descPlaceholder')"
                  :rows="2"
                  variant="none"
                  autoresize
                  :ui="{ base: 'p-2 text-sm text-gray-700 dark:text-gray-300 bg-transparent focus:ring-0 shadow-none !text-left' }"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Tags Row -->
            <div class="flex items-center group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
              <div class="w-24 md:w-32 shrink-0 px-4 py-3.5 text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider select-none">
                {{ $t('admin.art.tags') }}
              </div>
              <div class="flex-1 px-4 py-2 flex flex-wrap items-center gap-2">
                <UBadge
                  v-for="(tag, idx) in metadata.tags"
                  :key="idx"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="rounded-md px-2 py-1 text-sm font-medium group/tag"
                >
                  {{ tag }}
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="link"
                    :padded="false"
                    size="xs"
                    class="ml-1 opacity-50 hover:opacity-100"
                    @click="removeTag(idx)"
                  />
                </UBadge>
                <UInput
                  v-model="tagsInput"
                  :placeholder="metadata.tags.length ? '' : $t('admin.art.tagsPlaceholder')"
                  size="sm"
                  variant="none"
                  :ui="{ base: 'p-1 text-sm bg-transparent focus:ring-0 shadow-none min-w-[150px] !text-left' }"
                  class="min-w-[150px]"
                  @blur="updateTags"
                  @keyup.enter="updateTags"
                />
              </div>
            </div>

            <!-- Short ID Row -->
            <div class="flex items-center group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
              <div class="w-24 md:w-32 shrink-0 px-4 py-3.5 text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider select-none">
                {{ $t('admin.art.shortId') }}
              </div>
              <div class="flex-1 px-4 py-2 flex items-center justify-between">
                 <div class="font-mono text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                   {{ metadata.shortId || '-' }}
                 </div>
                 <UTooltip text="Regenerate ID">
                   <UButton
                      icon="i-lucide-refresh-cw"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      class="opacity-0 group-hover:opacity-100 transition-opacity"
                      @click="metadata.shortId = Math.random().toString(36).substring(2, 8).toUpperCase()"
                   />
                 </UTooltip>
              </div>
            </div>

            <!-- Cover Row -->
            <div class="flex items-center group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
              <div class="w-24 md:w-32 shrink-0 px-4 py-3.5 text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider select-none">
                {{ $t('admin.art.cover') }}
              </div>
              <div class="flex-1 px-2 py-1 flex items-center gap-3">
                 <UInput
                    v-model="metadata.image"
                    placeholder="https://..."
                    size="sm"
                    variant="none"
                    :ui="{ base: 'p-2 text-sm  dark:text-gray-400 bg-transparent focus:ring-0 shadow-none !text-left' }"
                    class="flex-1"
                  />
                  <div v-if="metadata.image" class="relative items-center justify-center hidden sm:flex">
                     <div class="relative h-8 w-12 rounded overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-700 shrink-0 group/preview">
                       <img :src="metadata.image" class="h-full w-full object-cover" />
                       <div class="absolute inset-0 bg-black/50 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" @click="metadata.image = ''">
                          <UIcon name="i-lucide-x" class="w-3 h-3 text-white" />
                       </div>
                     </div>
                  </div>
                  <UButton
                    icon="i-lucide-image"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="mr-2"
                    @click="uploadCoverImage"
                 />
              </div>
            </div>

            <!-- Options Row -->
            <div class="flex items-center justify-between px-4 py-2 bg-gray-50/30 dark:bg-gray-800/20">
               <div class="flex items-center gap-3">
                 <span class="text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider">{{ $t('admin.art.options') }}</span>
                 <div class="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                 <div class="flex items-center gap-2">
                   <USwitch v-model="metadata.isSticky" size="xs" color="primary" />
                   <span class="text-xs  dark:text-gray-400">{{ $t('admin.art.homeSticky') }}</span>
                 </div>
               </div>
               
               <UButton   
                  :label="$t('admin.art.collapseMetadata')"
                  icon="i-lucide-chevron-up"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  class=" hover:text-gray-900 dark:hover:text-white"
                  @click="isMetadataVisible = false"
                />
            </div>

          </div>
        </div>

        <!-- Collapsed state (simplified bar) -->
        <div v-show="!isMetadataVisible" class="flex items-center justify-between p-3 border border-gray-200/60 dark:border-gray-800/60 rounded-xl mb-4 bg-primary-50/10 dark:bg-primary-950/10 backdrop-blur-md shadow-sm transition-all hover:bg-primary-50/20 dark:hover:bg-primary-950/20 group/bar">
           <div class="flex items-center gap-6 px-2">
              <div class="flex items-center gap-3">
               <div class="w-24 md:w-32 shrink-0 px-4 py-3.5 text-xs font-semibold  dark:text-gray-400 uppercase tracking-wider select-none">
                {{ $t('admin.art.editorMode') }}
              </div>
                <URadioGroup
                  v-model="currentMode"
                  orientation="horizontal"
                  :items="items"
                  class="scale-90 origin-left"
                />
              </div>
           </div>
           
           <UButton
              icon="i-lucide-chevron-down"
              color="neutral"
              variant="ghost"
              size="xs"
              class=" hover:text-gray-900 dark:hover:text-white"
              :label="$t('admin.art.expandMetadata')" 
              @click="isMetadataVisible = true"
            />
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-hidden dark:bg-gray-900/50 px-4 pb-4">
      <div 
        id="editor-canvas" 
        class="w-full h-full bg-white dark:bg-slate-950   overflow-hidden flex flex-col"
      >
        <iframe
          v-if="!vditorInstance"
          :src="localePath('/blogs/' + article.path) + '?layout=false'"
          class="w-full h-full border-0"
        />
        <div id="preview-container" class="flex-1 w-full min-h-0" />
      </div>
    </div>

    <!-- 删除确认对话框 (Nuxt 4 / UI v3+ 规范) -->
    <UModal
      v-model:open="isDeleteModalOpen"
      :dismissible="false"
      :ui="{
        content: 'w-full sm:max-w-md overflow-hidden rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)] backdrop-blur-xl bg-white/95 dark:bg-gray-950/95'
      }"
    >
      <template #header>
        <div class="flex items-center gap-4 p-2">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
              <Icon name="i-lucide-flame" class="w-6 h-6 text-red-500 animate-pulse" />
            </div>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {{ $t('admin.art.confirmDelete') }}
            </h3>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {{ $t('admin.art.operationWarning') }}
            </p>
          </div>
        </div>
      </template>

      <template #body>
        <div class="space-y-6">
          <div class="console-card-red p-4 border border-red-500/10 bg-red-500/5 rounded-2xl">
            <div class="flex items-center gap-2 mb-2 opacity-60">
              <Icon name="i-lucide-terminal" class="w-3.5 h-3.5" />
              <span class="text-[10px] font-bold uppercase tracking-widest">{{ $t('admin.art.willDelete') }}</span>
            </div>
            <code class="text-xs font-mono text-red-500 break-all leading-relaxed">{{ article.path }}</code>
          </div>

          <div class="form-group font-bold">
            <label class="block text-[10px] font-black  uppercase tracking-widest mb-3 px-1">
              {{ $t('admin.art.confirmDeleteLabel') }}
            </label>
            <div class="relative group">
              <UInput
                ref="deleteInputRef"
                v-model="deleteConfirmText"
                size="xl"
                class="cyber-input-red"
                variant="none"
                :placeholder="$t('admin.art.inputPlaceholder', { path: article.path })"
              />
              <div class="absolute inset-0 rounded-2xl border border-red-500/20 group-focus-within:border-red-500 transition-colors pointer-events-none" />
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-3 w-full">
          <UButton
            color="neutral"
            variant="subtle"
            class="flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest transition-all hover:bg-gray-100 dark:hover:bg-white/5"
            @click="closeDeleteModal"
          >
            {{ $t('admin.art.cancel') }}
          </UButton>
          <UButton
            color="error"
            variant="solid"
            class="flex-1 h-12 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all hover:-translate-y-0.5"
            :loading="isDeleting"
            :disabled="deleteConfirmText.trim() !== article.path"
            @click="handleDelete"
          >
            {{ $t('admin.art.confirmDeleteLabel') }}
          </UButton>
        </div>
      </template>
    </UModal>
    <input
      ref="coverImageInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleCoverImageUpload"
    >
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { Article, Result } from '~/types'
import Vditor from 'vditor'
import 'vditor/src/assets/less/index.less'
import { watchDeep } from '@vueuse/shared'
import matter from 'gray-matter'

interface FrontMatter {
  title?: string
  date?: string | Date
  description?: string
  image?: string
  tags?: string[]
  published?: boolean | string | number
  isSticky?: boolean
  shortId?: string
}

const { t } = useI18n()
const localePath = useLocalePath()
const toast = useToast()
const props = defineProps<{
  article: Article
}>()

/* ---------- 响应式状态 ---------- */
const vditorInstance = ref<Vditor | null>(null)
const currentMode = ref<'wysiwyg' | 'ir' | 'sv'>('ir')
const editingPath = ref<string>()
const editTextContent = ref<string>()
const isSaving = ref(false)

const isMetadataVisible = ref(true)

// 元数据
const metadata = ref({
  title: '',
  date: '',
  description: '',
  image: '',
  tags: [] as string[],
  published: true,
  isSticky: false,
  shortId: ''
})
const tagsInput = ref('')
const coverImageInput = ref<HTMLInputElement>()

// 删除相关
const isDeleteModalOpen = ref(false)
const deleteConfirmText = ref('')
const deleteError = ref('')
const isDeleting = ref(false)
const deleteInputRef = ref()

const emits = defineEmits(['close', 'deleted'])

/* ---------- UI 选项 ---------- */
const items = computed(() => [
  {
    label: t('admin.art.wysiwyg'),
    value: 'wysiwyg',
    description: ''
  },
  {
    label: t('admin.art.instantRender'),
    value: 'ir',
    description: ''
  },
  {
    label: t('admin.art.splitView'),
    value: 'sv',
    description: ''
  }
])

/* ---------- 辅助函数 ---------- */
// 从 API 返回的 frontMatter 填充表单
const loadMetadata = (frontMatter: FrontMatter) => {
  metadata.value = {
    title: frontMatter.title || props.article.path || '',
    date: frontMatter.date
      ? new Date(frontMatter.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    description: frontMatter.description || '',
    image: frontMatter.image || '',
    tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
    published: frontMatter.published === true || frontMatter.published === 'true' || frontMatter.published === 1,
    isSticky: !!frontMatter.isSticky,
    shortId: (frontMatter.shortId as string) || (props.article.newBlog ? Math.random().toString(36).substring(2, 8).toUpperCase() : '')
  }
  tagsInput.value = metadata.value.tags.join(', ')

  // 智能显隐逻辑：检查核心元数据是否全部存在
  // 如果缺少 标题、日期、描述、封面、标签 中的任何一个，则默认展示面板，否则隐藏
  const isComplete = !!(
    frontMatter.title &&
    frontMatter.date &&
    frontMatter.description &&
    frontMatter.image &&
    Array.isArray(frontMatter.tags) &&
    frontMatter.tags.length > 0
  )
  isMetadataVisible.value = !isComplete
}

// 生成 frontMatter（YAML）
const generateFrontmatter = (): string => {
  const data = {
    title: metadata.value.title || props.article.path,
    date: metadata.value.date ? new Date(metadata.value.date).toISOString() : new Date().toISOString(),
    description: metadata.value.description || '',
    image: metadata.value.image || '',
    tags: metadata.value.tags,
    published: metadata.value.published,
    isSticky: metadata.value.isSticky,
    shortId: metadata.value.shortId || Math.random().toString(36).substring(2, 8).toUpperCase()
  }
  return matter.stringify('', data).trim()
}

// 更新标签数组
const updateTags = () => {
  metadata.value.tags = tagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
}

// 删除单个标签
const removeTag = (idx: number) => {
  metadata.value.tags.splice(idx, 1)
  tagsInput.value = metadata.value.tags.join(', ')
}

// 封面图上传
const uploadCoverImage = () => {
  coverImageInput.value?.click()
}
const handleCoverImageUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !editingPath.value) return

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('uploadPath', editingPath.value)

    const response = await $fetch<Result<{ url: string, filename: string }>>('/api/article/upload', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      metadata.value.image = response.data.url
      toast.add({ title: t('admin.art.coverUploadSuccess'), color: 'success', icon: 'i-heroicons-check-circle' })
    }
  } catch {
    toast.add({ title: t('admin.art.coverUploadFailed'), color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    if (target) target.value = ''
  }
}

/* ---------- 业务流程 ---------- */
const handleClose = () => {
  if (vditorInstance.value) {
    vditorInstance.value.destroy()
    vditorInstance.value = null
  }
  emits('close')
}

/* 删除相关 */
const openDeleteModal = () => {
  deleteConfirmText.value = ''
  deleteError.value = ''
  isDeleteModalOpen.value = true
  nextTick(() => deleteInputRef.value?.input?.focus())
}
const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  deleteConfirmText.value = ''
  deleteError.value = ''
  isDeleting.value = false
}
const handleDelete = async () => {
  if (deleteConfirmText.value.trim() !== props.article.path) {
    deleteError.value = t('admin.art.pathMismatch')
    return
  }
  isDeleting.value = true
  deleteError.value = ''

  try {
    const result: Result<unknown> = await $fetch('/api/article/delete', {
      method: 'DELETE',
      body: { path: props.article.path }
    })
    if (result.success) {
      toast.add({ title: t('admin.art.deleted'), description: t('admin.art.deletedDesc', { path: props.article.path }), color: 'success' })
      handleClose()
      emits('deleted', props.article)
    } else {
      deleteError.value = result.err || t('admin.art.saveFailed') // Fallback should also be i18n
      toast.add({ title: t('admin.art.saveFailed'), description: result.err, color: 'error' })
    }
  } catch {
    deleteError.value = t('admin.art.saveFailed')
    toast.add({ title: t('admin.art.saveFailed'), description: t('admin.art.networkError'), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
watch(deleteConfirmText, () => {
  if (deleteError.value) deleteError.value = ''
})

/* 读取文章内容（只返回正文）并加载元数据 */
const articleContent = async () => {
  if (!props.article) return ''
  const result = await $fetch<Result<{ content: string, frontMatter: FrontMatter }>>('/api/article/content', {
    method: 'POST',
    body: { path: props.article.path }
  })
  if (!result.success) {
    toast.add({ title: t('admin.art.loadFailed'), description: result.err, color: 'error' })
    return ''
  }

  // 填充元数据表单
  loadMetadata(result.data.frontMatter)

  // 只返回正文（不含 frontMatter）
  const prefix = '/api/article/fetch?path=' + encodeURIComponent(props.article.path + '/')
  return result.data.content.replace(/!\[(.*?)\]\(\1\)/g, `![$1](${prefix}$1)`)
}

/* 计算编辑器高度 */
const calculateEditorHeight = () => {
  const container = document.getElementById('preview-container')
  if (!container) return 400
  return new Promise<number>((resolve) => {
    requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect()
      resolve(Math.max(rect.height - 20, 300))
    })
  })
}
const previewArticle = async () => {
  if (vditorInstance.value) {
    vditorInstance.value.destroy()
    vditorInstance.value = null
  }
}
/* 编辑文章（加载内容或刷新） */
const editArticle = async (refresh = true) => {
  editingPath.value = props.article.path
  if (refresh) editTextContent.value = await articleContent()

  const container = document.getElementById('preview-container')
  if (!container) return

  container.innerHTML = ''
  if (vditorInstance.value) {
    vditorInstance.value.destroy()
    vditorInstance.value = null
  }

  await nextTick()
  const editorHeight = await calculateEditorHeight()

  vditorInstance.value = new Vditor(container, {
    i18n: window.VditorI18n,
    height: editorHeight,
    minHeight: 300,
    mode: currentMode.value,
    theme: useColorMode().value === 'dark' ? 'dark' : 'classic',
    value: editTextContent.value,
    placeholder: t('admin.art.editorPlaceholder'), // 替换: '开始写作...'
    upload: {
      multiple: false,
      handler(files) {
        const file = files[0]
        if (!file) return Promise.resolve(null)

        const uploadImage = async () => {
          if (!editingPath.value) {
            vditorInstance.value?.tip(t('admin.art.pathEmpty'), 3000) // 替换: '目录不能为空'
            return
          }
          try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('uploadPath', editingPath.value)

            const response = await $fetch<Result<{
              originalName: string
              filename: string
              url: string
              path: string
              fullPath: string
              size: number
              type: string
            }>>('/api/article/upload', {
              method: 'POST',
              body: formData
            })

            if (response.success) {
              const url = response.data.url
              const imgUrl = url.startsWith('http') ? url : window.location.origin + url
              vditorInstance.value?.insertValue(`![${response.data.filename}](${imgUrl})`)
            }
          } catch {
            console.error('Upload failed')
            vditorInstance.value?.tip(t('admin.art.coverUploadFailed'), 3000) // 替换: '图片上传失败'
          }
        }
        uploadImage()
        return Promise.resolve(null)
      }
    },
    preview: {
      hljs: {
        defaultLang: 'sh',
        lineNumber: false,
        style: 'github',
        enable: true
      }
    },
    toolbar: [
      'emoji',
      'headings',
      'bold',
      'italic',
      'link',
      '|',
      'list',
      'ordered-list',
      'check',
      'outdent',
      'indent',
      'quote',
      'line',
      'code',
      'inline-code',
      'insert-before',
      'insert-after',
      'table',
      'upload',
      'undo',
      'redo'
    ],
    cache: { enable: false }
  })
}

/* 保存文章（生成 frontMatter 并写入） */
const saveArticle = async () => {
  const body = vditorInstance.value?.getValue()
  if (!body?.trim()) {
    toast.add({ title: t('admin.art.contentEmpty'), color: 'error', icon: 'i-heroicons-x-circle' }) // 替换: '内容不能为空'
    return
  }
  if (!metadata.value.title?.trim()) {
    toast.add({ title: t('admin.art.titleEmpty'), color: 'error', icon: 'i-heroicons-x-circle' }) // 替换: '标题不能为空'
    return
  }

  isSaving.value = true
  try {
    const frontmatter = generateFrontmatter()
    const fullContent = `${frontmatter}\n\n${body}`
    const payload = fullContent.replace(/!\[(.*?)\]\(.*?\/api\/article\/fetch\?path=.*?\)/g, '![$1]($1)')

    const res = await $fetch('/api/article/save', {
      method: 'PUT',
      body: { path: editingPath.value, content: payload, originalPath: props.article.path }
    })

    if (res.success) {
      toast.add({ title: t('admin.art.success'), color: 'success', icon: 'i-heroicons-check-circle' }) // 替换: '保存成功'
      if (vditorInstance.value) {
        vditorInstance.value.destroy()
        vditorInstance.value = null
      }
    } else {
      toast.add({ title: t('admin.art.saveFailed'), description: res.err, color: 'error', icon: 'i-heroicons-x-circle' }) // 替换: '保存失败'
    }
  } catch {
    toast.add({ title: t('admin.art.saveFailed'), description: t('admin.art.networkError'), color: 'error', icon: 'i-heroicons-x-circle' }) // 替换: '保存失败', '网络错误或服务器异常'
  } finally {
    isSaving.value = false
  }
}

/* ---------- 生命周期 & 监听 ---------- */
onMounted(() => {
  if (props.article.newBlog) {
    editTextContent.value = ''
    loadMetadata({})
    editArticle(false)
    return
  }
})

onUnmounted(() => {
  if (vditorInstance.value) {
    vditorInstance.value.destroy()
    vditorInstance.value = null
  }
})

watch(
  () => currentMode.value,
  () => {
    if (vditorInstance.value) editTextContent.value = vditorInstance.value.getValue()
    editArticle(false)
  }
)

watchDeep(
  () => props.article,
  (article) => {
    if (article.newBlog) {
      editTextContent.value = ''
      loadMetadata({})
      editArticle(false)
      return
    }
    if (vditorInstance.value) editArticle(true)
  }
)
</script>

<style scoped>
/* ===== 控制台仪表盘卡片 ===== */
.metadata-console {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
}

.dark .metadata-console {
  background: rgba(10, 10, 15, 0.4);
}

.console-card {
  background: rgba(255, 255, 255, 0.6);
  border: 1.5px solid rgba(0, 0, 0, 0.04);
  border-radius: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .console-card {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(255, 255, 255, 0.04);
}

.console-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 12px 24px -10px rgba(99, 102, 241, 0.15);
}

.dark .console-card:hover {
  background: rgba(30, 41, 59, 0.6);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.4);
}

/* ===== 极简 Cyber 输入框 ===== */
.cyber-input-minimal {
  width: 100%;
}

.cyber-input-minimal :deep(input),
.cyber-input-minimal :deep(textarea) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  font-weight: 700;
  font-size: 0.9375rem;
  box-shadow: none !important;
  letter-spacing: -0.01em;
  width: 100% !important;
  flex: 1;
  text-align: left !important;
}

.cyber-input-minimal :deep(input:focus),
.cyber-input-minimal :deep(textarea:focus) {
  color: #6366f1;
}

/* ===== 删除模式专供样式 ===== */
.console-card-red {
  background: rgba(239, 68, 68, 0.05);
  border-radius: 1.25rem;
}

.cyber-input-red :deep(input) {
  background: rgba(255, 255, 255, 0.5) !important;
  padding: 1rem 1.25rem !important;
  font-weight: 800;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.dark .cyber-input-red :deep(input) {
  background: rgba(15, 10, 10, 0.6) !important;
}


/* 工具栏图标大小 */
:deep(.vditor-toolbar svg) {
  width: 16px !important;
  height: 16px !important;
}

/* 防止双层滚动条 */
:deep(#preview-container) {
  overflow: hidden;
  position: relative;
}

/* Vditor 完全填充容器 */
:deep(.vditor) {
  height: 100% !important;
  border: none !important;
  background: transparent !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.vditor-toolbar) {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
  padding: 0 1.25rem !important;
  border-radius: 0 !important;
  filter: none !important;
  backdrop-filter: none !important;
  mix-blend-mode: normal !important;
  /* 确保不裁剪溢出的弹框 */
  overflow: visible !important;
}

.dark :deep(.vditor-toolbar) {
  background: rgba(15, 23, 42, 0.7) !important;
  border-bottom-color: rgba(255, 255, 255, 0.05) !important;
}

:deep(.vditor-content) {
  background: transparent !important;
}

:deep(.vditor-reset) {
  background: transparent !important;
  color: inherit !important;
  padding: 1.5rem 2rem !important;
}

.dark :deep(.vditor-reset) {
  color: #e2e8f0 !important;
}

/* --- 列表样式隔离：仅作用于非组件列表 --- */
:deep(.vditor-reset ol:not([class])),
:deep(.vditor-reset ul:not([class])) {
  margin-left: 2.2em !important;
  padding-left: 0 !important;
}

:deep(.vditor-reset ol:not([class]) li),
:deep(.vditor-reset ul:not([class]) li) {
  display: list-item !important;
  margin-bottom: 0.4em !important;
  list-style-position: outside !important;
}

:deep(.vditor-reset ol:not([class])) { list-style-type: decimal !important; }
:deep(.vditor-reset ul:not([class])) { list-style-type: disc !important; }



.dark :deep(.vditor-reset pre) {
  background: rgba(0, 0, 0, 0.25) !important;
}

/* 彻底清除代码块内部所有元素的列表样式干扰 */
:deep(.vditor-reset pre *) {
  list-style: none !important;
  list-style-type: none !important;
  text-indent: 0 !important;
}

:deep(.vditor-linenumber) {
  display: none !important; /* 彻底隐藏行号 */
}

:deep(.vditor-reset pre > code) {
  display: block !important;
  padding: 1rem 1.25rem !important;
  text-align: left !important;
  white-space: pre !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
  background: transparent !important;
  overflow-x: auto !important;
}

:deep(.vditor-toolbar__item button) {
  color: #64748b !important;
}

.dark :deep(.vditor-toolbar__item button) {
  color: #94a3b8 !important;
}

:deep(.vditor-toolbar__item--active button),
:deep(.vditor-toolbar__item button:hover) {
  color: #6366f1 !important;
  background: rgba(99, 102, 241, 0.1) !important;
}
</style>
