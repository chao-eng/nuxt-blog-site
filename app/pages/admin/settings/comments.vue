<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Result } from '~/types'

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
    const response = await $fetch<Result<Record<string, unknown>>>('/api/comments/config')
    if (response.success && response.data) {
      const config = response.data as any
      enableComments.value = config.enableComments
      repo.value = config.repo
      repoId.value = config.repoId
      category.value = config.category
      categoryId.value = config.categoryId
    }
  } catch (error: unknown) {
    toast.add({
      title: t('admin.set.comments.loadFailed'),
      description: (error as Error).message || t('admin.set.comments.loadError'),
      color: 'error'
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
        color: 'error'
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
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: t('admin.set.comments.saveFailed'),
      description: (error as Error).message || t('admin.set.comments.saveError'),
      color: 'error'
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
  <div class="space-y-8 pb-20">
    <!-- 顶部操作栏 -->
    <div class="flex items-center justify-between px-2">
      <div class="flex flex-col gap-1">
        <h2 class="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">{{ t('admin.set.comments.title') }}</h2>
        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider opacity-70">Configuration for Giscus</p>
      </div>
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-refresh-cw"
          variant="soft"
          color="neutral"
          class="rounded-xl h-10 px-4"
          :loading="loading"
          @click="loadConfig"
        />
        <UButton
          color="primary"
          :loading="saving"
          class="action-btn-glow h-10 px-8 rounded-xl font-bold uppercase tracking-widest transition-all"
          @click="saveConfig"
        >
          {{ t('admin.set.comments.save') }}
        </UButton>
      </div>
    </div>

    <div class="settings-section-card glass-morphism p-6 lg:p-10 space-y-10">
      <!-- 开启/关闭评论 -->
      <section class="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <UIcon name="i-lucide-message-square" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-base font-black text-gray-900 dark:text-white">
              {{ t('admin.set.comments.enableComments') }}
            </h3>
            <p class="text-xs text-gray-500 font-medium">
              {{ t('admin.set.comments.enableCommentsDesc') }}
            </p>
          </div>
        </div>
        <USwitch v-model="enableComments" color="primary" />
      </section>

      <div class="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />

      <!-- Giscus 配置内容 -->
      <section class="space-y-8" :class="{ 'opacity-50 pointer-events-none grayscale transition-all': !enableComments }">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
            <h3 class="text-sm font-black text-gray-400 uppercase tracking-widest">Giscus Details</h3>
          </div>
          <a href="https://giscus.app/zh-CN" target="_blank" class="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
            {{ t('admin.set.comments.getConfigInfo') }}
            <UIcon name="i-lucide-external-link" class="w-3 h-3" />
          </a>
        </div>

        <div class="p-4 rounded-2xl bg-indigo-500/5 border border-dashed border-indigo-500/20">
           <div class="flex items-start gap-3">
             <UIcon name="i-lucide-info" class="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
             <div class="space-y-1">
               <h4 class="text-sm font-black text-indigo-500 uppercase tracking-tight">{{ t('admin.set.comments.configInstructions') }}</h4>
               <p class="text-xs text-gray-500 font-medium leading-relaxed">{{ t('admin.set.comments.configInstructionsDesc') }}</p>
             </div>
           </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <UFormField :label="t('admin.set.comments.repository')" required class="cyber-field">
            <UInput v-model="repo" :placeholder="t('admin.set.comments.repoPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.comments.repositoryId')" required class="cyber-field">
            <UInput v-model="repoId" :placeholder="t('admin.set.comments.repoIdPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.comments.category')" required class="cyber-field">
            <UInput v-model="category" :placeholder="t('admin.set.comments.categoryPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.comments.categoryId')" required class="cyber-field">
            <UInput v-model="categoryId" :placeholder="t('admin.set.comments.categoryIdPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>
        </div>
      </section>

      <div class="flex justify-end gap-3 pt-6">
        <UButton
          variant="ghost"
          color="neutral"
          class="h-11 px-6 rounded-xl font-bold uppercase tracking-widest"
          @click="loadConfig"
        >
          {{ t('admin.set.comments.cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          class="action-btn-glow h-11 px-8 rounded-xl font-bold uppercase tracking-widest transition-all"
          @click="saveConfig"
        >
          {{ t('admin.set.comments.save') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-morphism {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.dark .glass-morphism {
  background: rgba(15, 23, 42, 0.3);
  border-color: rgba(255, 255, 255, 0.05);
}

.settings-section-card {
  border-radius: 2.5rem;
  box-shadow: 0 20px 50px -15px rgba(0, 0, 0, 0.05);
}

.dark .settings-section-card {
  box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.4);
}

.action-btn-glow {
  background: linear-gradient(135deg, #6366f1, #a855f7) !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;
}

.action-btn-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.5) !important;
}

.cyber-field :deep(label) {
  font-size: 0.75rem !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  color: #94a3b8 !important;
  margin-bottom: 0.5rem !important;
}

.cyber-input-minimal :deep(input) {
  background: rgba(0, 0, 0, 0.03) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  border-radius: 1.25rem !important;
  padding: 0.85rem 1.25rem !important;
  transition: all 0.3s ease !important;
  font-weight: 600 !important;
}

.dark .cyber-input-minimal :deep(input) {
  background: rgba(255, 255, 255, 0.02) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

.cyber-input-minimal:focus-within :deep(input) {
  background: white !important;
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
}

.dark .cyber-input-minimal:focus-within :deep(input) {
  background: rgba(30, 41, 59, 0.5) !important;
}
</style>
