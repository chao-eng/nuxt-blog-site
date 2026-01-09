<template>
  <UDashboardPanel id="article-2" class="flex flex-col h-full">
    <UDashboardNavbar :toggle="false" class="border-b border-gray-200/60 dark:border-gray-800/60">
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
      <div class="p-3 bg-gradient-to-r from-gray-50/50 via-white/80 to-gray-50/50 dark:from-gray-900/50 dark:via-gray-950/80 dark:to-gray-900/50 border-b border-gray-200/60 dark:border-gray-800/60">
        <div class="space-y-2">
          <div v-show="isMetadataVisible" class="space-y-2">
            <div class="grid grid-cols-12 gap-2">
              <div class="col-span-6 p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-heading" class="w-3.5 h-3.5 text-blue-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.title') }}</span>
                </div>
                <UFormField required>
                  <UInput
                    v-model="metadata.title"
                    :placeholder="$t('admin.art.titlePlaceholder')"
                    size="sm"
                    maxlength="100"
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="col-span-3 p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-indigo-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.date') }}</span>
                </div>
                <UFormField required>
                  <UInput
                    v-model="metadata.date"
                    type="datetime-local"
                    size="sm"
                  />
                </UFormField>
              </div>

              <div class="col-span-3 p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-toggle-right" class="w-3.5 h-3.5 text-indigo-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.status') }}</span>
                </div>
                <div class="flex items-center justify-between h-8 px-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <span class="text-xs font-medium">
                    {{ metadata.published ? $t('admin.art.published') : $t('admin.art.draft') }}
                  </span>
                  <USwitch
                    v-model="metadata.published"
                    checked-icon="i-lucide-check"
                    unchecked-icon="i-lucide-x"
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-12 gap-2">
              <div class="col-span-6 p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-align-left" class="w-3.5 h-3.5 text-purple-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.description') }}</span>
                </div>
                <UFormField>
                  <UTextarea
                    v-model="metadata.description"
                    :placeholder="$t('admin.art.descPlaceholder')"
                    :rows="2"
                    maxlength="200"
                    autoresize
                    class="w-full"
                  />
                </UFormField>
              </div>

              <div class="col-span-3 p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-tags" class="w-3.5 h-3.5 text-green-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.tags') }}</span>
                </div>
                <UFormField>
                  <UInput
                    v-model="tagsInput"
                    :placeholder="$t('admin.art.tagsPlaceholder')"
                    size="sm"
                    class="w-full"
                    @blur="updateTags"
                    @keyup.enter="updateTags"
                  />
                </UFormField>

                <div v-if="metadata.tags.length" class="flex flex-wrap gap-1 mt-2">
                  <UBadge
                    v-for="(tag, idx) in metadata.tags"
                    :key="idx"
                    color="primary"
                    variant="soft"
                    size="sm"
                    class="cursor-pointer hover:scale-105 transition-all duration-200 group px-2 py-0.5 rounded-full"
                    @click="removeTag(idx)"
                  >
                    <div class="flex items-center gap-1">
                      <span class="text-xs">{{ tag }}</span>
                      <UIcon
                        name="i-lucide-x"
                        class="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 group-hover:text-red-500 transition-all duration-200"
                      />
                    </div>
                  </UBadge>
                </div>
              </div>

              <div class="col-span-3 p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-image" class="w-3.5 h-3.5 text-pink-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.cover') }}</span>
                </div>
                <div class="flex gap-1">
                  <UInput
                    v-model="metadata.image"
                    placeholder="URL"
                    size="sm"
                    class="flex-1"
                  />
                  <UButton
                    icon="i-lucide-upload"
                    size="sm"
                    color="primary"
                    variant="soft"
                    @click="uploadCoverImage"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <div v-if="metadata.image" class="flex-shrink-0 w-1/4">
              <div class="p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60 h-full flex flex-col">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-image" class="w-3.5 h-3.5 text-pink-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.coverPreview') }}</span>
                </div>
                <div class="relative group flex-1">
                  <img
                    :src="metadata.image"
                    :alt="$t('admin.art.cover')"
                    class="w-full aspect-video object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <UButton
                      icon="i-lucide-trash-2"
                      size="xs"
                      color="error"
                      @click="metadata.image = ''"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex-1">
              <div class="p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60 h-full flex flex-col">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-settings" class="w-3.5 h-3.5 text-gray-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.editorMode') }}</span>
                </div>
                <div class="flex-1 flex items-center gap-2">
                  <URadioGroup
                    v-model="currentMode"
                    orientation="horizontal"
                    color="primary"
                    variant="card"
                    :items="items"
                    :ui="{
                      fieldset: 'flex flex-nowrap gap-2 w-full',
                      legend: 'sr-only'
                    }"
                  />
                </div>
              </div>
            </div>
            <div class="w-1/5">
              <div class="p-3 rounded-lg shadow-sm border-0 bg-white/60 dark:bg-gray-900/60 h-full flex flex-col">
                <div class="flex items-center gap-1.5 mb-2">
                  <UIcon name="i-lucide-pin" class="w-3.5 h-3.5 text-orange-500" />
                  <span class="font-medium text-xs text-gray-700 dark:text-gray-300">{{ $t('admin.art.homeSticky') }}</span>
                </div>
                <div class="flex-1 flex items-center justify-center">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ metadata.isSticky ? $t('admin.art.sticked') : $t('admin.art.notSticked') }}
                    </span>
                    <USwitch
                      v-model="metadata.isSticky"
                      checked-icon="i-lucide-pin"
                      unchecked-icon="i-lucide-minus"
                      size="md"
                      color="warning"
                      class="flex-1"
                    />
                    <UTooltip :text="isMetadataVisible ? $t('admin.art.collapseMetadata') : $t('admin.art.expandMetadata')">
                      <UButton
                        :icon="isMetadataVisible ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        @click="isMetadataVisible = !isMetadataVisible"
                      />
                    </UTooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 overflow-hidden bg-white dark:bg-gray-950">
      <iframe
        v-if="!vditorInstance"
        :src="localePath('/blogs/' + article.path) + '?layout=false'"
        class="w-full h-full border-0"
      />
      <div id="preview-container" class="w-full h-full" />
    </div>

    <UModal
      :open="isDeleteModalOpen"
      prevent-close
    >
      <template #content>
        <UCard class="shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95">
          <template #header>
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                  {{ $t('admin.art.confirmDelete') }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {{ $t('admin.art.operationWarning') }}
                </p>
              </div>
            </div>
          </template>

          <div class="space-y-6">
            <UAlert
              color="error"
              variant="soft"
              :title="$t('admin.art.dangerWarning')"
              class="border border-red-200 dark:border-red-800"
            >
              <template #description>
                <div class="space-y-3 mt-2">
                  <p class="text-sm">
                    {{ $t('admin.art.willDelete') }}
                  </p>
                  <div class="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
                    <code class="text-sm font-mono text-red-800 dark:text-red-200">{{ article.path }}</code>
                  </div>
                  <p class="text-sm text-red-700 dark:text-red-300">
                    ⚠️ {{ $t('admin.art.permanentLoss') }}
                  </p>
                </div>
              </template>
            </UAlert>

            <UCard class="border border-gray-200 dark:border-gray-700">
              <UFormField
                :label="$t('admin.art.confirmDeleteLabel')"
                required
                :help="$t('admin.art.confirmDeleteHelp')"
              >
                <UInput
                  ref="deleteInputRef"
                  v-model="deleteConfirmText"
                  :placeholder="$t('admin.art.inputPlaceholder', { path: article.path })"
                  :error="!!deleteError"
                  class="font-mono transition-all duration-200"
                  @keyup.enter="handleDelete"
                  @keyup.escape="closeDeleteModal"
                />
                <template v-if="deleteError" #error>
                  <div class="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <UIcon name="i-lucide-alert-circle" class="w-4 h-4" />
                    {{ deleteError }}
                  </div>
                </template>
              </UFormField>
            </UCard>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="ghost"
                size="md"
                :disabled="isDeleting"
                @click="closeDeleteModal"
              >
                {{ $t('admin.art.cancel') }}
              </UButton>
              <UButton
                color="error"
                variant="solid"
                size="md"
                :loading="isDeleting"
                :disabled="deleteConfirmText.trim() !== article.path"
                icon="i-lucide-trash-2"
                @click="handleDelete"
              >
                {{ isDeleting ? $t('admin.art.deleting') : $t('admin.art.confirmDeleteLabel') }}
              </UButton>
            </div>
          </template>
        </UCard>
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
  isSticky: false
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
    title: frontMatter.title || props.article.path,
    date: frontMatter.date
      ? new Date(frontMatter.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    description: frontMatter.description || '',
    image: frontMatter.image || '',
    tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
    published: frontMatter.published === true || frontMatter.published === 'true' || frontMatter.published === 1,
    isSticky: !!frontMatter.isSticky

  }
  tagsInput.value = metadata.value.tags.join(', ')
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
    isSticky: metadata.value.isSticky
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
    theme: 'classic',
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
        lineNumber: true,
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
      editArticle(false)
      return
    }
    if (vditorInstance.value) editArticle(true)
  }
)
</script>

<style scoped>
/* 工具栏图标大小 */
:deep(.vditor-toolbar svg) {
  width: 16px !important;
  height: 16px !important;
}

/* 列表样式 */
:deep(.vditor-reset) {
  ol {
    list-style-type: decimal !important;
    margin-left: 2em !important;
    padding-left: 0 !important;
  }
  ul {
    list-style-type: disc !important;
    margin-left: 2em !important;
    padding-left: 0 !important;
  }
  li {
    display: list-item !important;
    margin-bottom: 0.25em !important;
  }
}

/* 防止双层滚动条 */
:deep(#preview-container) {
  overflow: hidden;
}

/* Vditor 完全填充容器 */
:deep(.vditor) {
  height: 100% !important;
  border: none;
}
</style>
