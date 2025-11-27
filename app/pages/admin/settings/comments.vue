<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

const { t } = useI18n()

const enableComments = ref(false)
const repo = ref('')
const repoId = ref('')
const category = ref('')
const categoryId = ref('')

const loading = ref(false)
const saving = ref(false)
const toast = useToast()

// 加载配置
async function loadConfig() {
  loading.value = true
  try {
    const response: any = await $fetch('/api/comments/config')
    if (response.success && response.data) {
      const config = response.data
      enableComments.value = config.enableComments
      repo.value = config.repo
      repoId.value = config.repoId
      category.value = config.category
      categoryId.value = config.categoryId
    }
  } catch (error: any) {
    toast.add({
      title: t('admin.set.comments.loadFailed'),
      description: error.message || t('admin.set.comments.loadError'),
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// 保存配置
async function saveConfig() {
  if (enableComments.value) {
    if (!repo.value || !repoId.value || !category.value || !categoryId.value) {
      toast.add({
        title: t('admin.set.comments.incompleteConfig'),
        description: t('admin.set.comments.allFieldsRequired'),
        color: 'red'
      })
      return
    }
  }

  saving.value = true
  try {
    await $fetch('/api/comments/config', {
      method: 'POST',
      body: {
        enableComments: enableComments.value,
        repo: repo.value,
        repoId: repoId.value,
        category: category.value,
        categoryId: categoryId.value
      }
    })
    
    toast.add({
      title: t('admin.set.comments.saveSuccess'),
      description: t('admin.set.comments.configUpdated'),
      color: 'green'
    })
  } catch (error: any) {
    toast.add({
      title: t('admin.set.comments.saveFailed'),
      description: error.message || t('admin.set.comments.saveError'),
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="container mx-auto p-6 max-w-6xl">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">{{ t('admin.set.comments.title') }}</h1>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            :loading="loading"
            @click="loadConfig"
          >
            {{ t('admin.set.comments.refresh') }}
          </UButton>
        </div>
      </template>

      <div class="space-y-6">
        <!-- 开启/关闭评论 -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ t('admin.set.comments.enableComments') }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('admin.set.comments.enableCommentsDesc') }}</p>
          </div>
          <USwitch v-model="enableComments" />
        </div>

        <USeparator />

        <!-- Giscus 配置 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ t('admin.set.comments.giscusConfig') }}</h3>
            <a href="https://giscus.app/zh-CN" target="_blank" class="text-sm text-primary hover:underline">
              {{ t('admin.set.comments.getConfigInfo') }} &rarr;
            </a>
          </div>

          <UAlert
            icon="i-lucide-info"
            color="blue"
            variant="soft"
            :title="t('admin.set.comments.configInstructions')"
            :description="t('admin.set.comments.configInstructionsDesc')"
          />

          <div class="space-y-4">
            <UFormField :label="t('admin.set.comments.repository')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="repo" :placeholder="t('admin.set.comments.repoPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.comments.repositoryId')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="repoId" :placeholder="t('admin.set.comments.repoIdPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.comments.category')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="category" :placeholder="t('admin.set.comments.categoryPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.comments.categoryId')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="categoryId" :placeholder="t('admin.set.comments.categoryIdPlaceholder')" class="w-full" />
            </UFormField>
          </div>
        </div>

        <USeparator />

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-2">
          <UButton
            variant="outline"
            @click="loadConfig"
          >
            {{ t('admin.set.comments.cancel') }}
          </UButton>
          <UButton
            color="primary"
            :loading="saving"
            @click="saveConfig"
          >
            {{ t('admin.set.comments.save') }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
