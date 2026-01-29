<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Result } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

const { t } = useI18n()

const enableS3 = ref(false)
const accessKeyId = ref('')
const secretAccessKey = ref('')
const region = ref('')
const bucket = ref('')
const endpoint = ref('')
const publicUrl = ref('')
const path = ref('')

const loading = ref(false)
const saving = ref(false)
const toast = useToast()

// 加载配置
async function loadConfig() {
  loading.value = true
  try {
    const response = await $fetch<Result<Record<string, any>>>('/api/s3/config')
    if (response.success && response.data) {
      const config = response.data
      enableS3.value = !!config.enableS3
      accessKeyId.value = config.accessKeyId || ''
      secretAccessKey.value = config.secretAccessKey || ''
      region.value = config.region || ''
      bucket.value = config.bucket || ''
      endpoint.value = config.endpoint || ''
      publicUrl.value = config.publicUrl || ''
      path.value = config.path || ''
    }
  } catch (error: unknown) {
    toast.add({
      title: t('admin.set.s3.loadFailed'),
      description: (error as Error).message || t('admin.set.s3.loadError'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 保存配置
async function saveConfig() {
  if (enableS3.value) {
    if (!accessKeyId.value || !secretAccessKey.value || !region.value || !bucket.value || !endpoint.value || !publicUrl.value) {
      toast.add({
        title: t('admin.set.s3.incompleteConfig'),
        description: t('admin.set.s3.allFieldsRequired'),
        color: 'error'
      })
      return
    }
  }

  saving.value = true
  try {
    const response = await $fetch<Result<undefined>>('/api/s3/config', {
      method: 'POST',
      body: {
        enableS3: enableS3.value,
        accessKeyId: accessKeyId.value,
        secretAccessKey: secretAccessKey.value,
        region: region.value,
        bucket: bucket.value,
        endpoint: endpoint.value,
        publicUrl: publicUrl.value,
        path: path.value
      }
    })

    if (response.success) {
      toast.add({
        title: t('admin.set.s3.saveSuccess'),
        description: t('admin.set.s3.configUpdated'),
        color: 'success'
      })
    } else {
      toast.add({
        title: t('admin.set.s3.saveFailed'),
        description: response.err || t('admin.set.s3.saveError'),
        color: 'error'
      })
    }
  } catch (error: unknown) {
    toast.add({
      title: t('admin.set.s3.saveFailed'),
      description: (error as any).data?.err || (error as Error).message || t('admin.set.s3.saveError'),
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
        <h2 class="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">{{ t('admin.set.s3.title') }}</h2>
        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider opacity-70">Obect Storage Service Settings</p>
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
          {{ t('admin.set.s3.save') }}
        </UButton>
      </div>
    </div>

    <div class="settings-section-card glass-morphism p-6 lg:p-10 space-y-10">
      <!-- 开启/关闭 S3 -->
      <section class="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <UIcon name="i-lucide-cloud-upload" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 class="text-base font-black text-gray-900 dark:text-white">
              {{ t('admin.set.s3.enableS3') }}
            </h3>
            <p class="text-xs text-gray-500 font-medium">
              {{ t('admin.set.s3.enableS3Desc') }}
            </p>
          </div>
        </div>
        <USwitch v-model="enableS3" color="primary" />
      </section>

      <div class="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />

      <!-- S3 核心配置 -->
      <section class="space-y-8" :class="{ 'opacity-50 pointer-events-none grayscale transition-all text-gray-400': !enableS3 }">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
            <h3 class="text-sm font-black text-gray-400 uppercase tracking-widest">{{ t('admin.set.s3.basicConfig') }}</h3>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-indigo-500/5 border border-dashed border-indigo-500/20">
           <div class="flex items-start gap-3">
             <UIcon name="i-lucide-info" class="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
             <div class="space-y-1">
               <h4 class="text-sm font-black text-indigo-500 uppercase tracking-tight">{{ t('admin.set.s3.configInstructions') }}</h4>
               <p class="text-xs text-gray-500 font-medium leading-relaxed">{{ t('admin.set.s3.configInstructionsDesc') }}</p>
             </div>
           </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <UFormField :label="t('admin.set.s3.accessKeyId')" required class="cyber-field">
            <UInput v-model="accessKeyId" :placeholder="t('admin.set.s3.accessKeyIdPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.s3.secretAccessKey')" required class="cyber-field">
            <UInput v-model="secretAccessKey" type="password" :placeholder="t('admin.set.s3.secretAccessKeyPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.s3.endpoint')" required class="cyber-field">
            <UInput v-model="endpoint" :placeholder="t('admin.set.s3.endpointPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.s3.region')" required class="cyber-field">
            <UInput v-model="region" :placeholder="t('admin.set.s3.regionPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.s3.bucket')" required class="cyber-field">
            <UInput v-model="bucket" :placeholder="t('admin.set.s3.bucketPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.s3.publicUrl')" required class="cyber-field">
            <UInput v-model="publicUrl" :placeholder="t('admin.set.s3.publicUrlPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
          </UFormField>

          <UFormField :label="t('admin.set.s3.path')" class="md:col-span-2 cyber-field">
            <UInput v-model="path" :placeholder="t('admin.set.s3.pathPlaceholder')" size="xl" variant="none" class="cyber-input-minimal" />
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
          {{ t('admin.set.s3.cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          class="action-btn-glow h-11 px-8 rounded-xl font-bold uppercase tracking-widest transition-all"
          @click="saveConfig"
        >
          {{ t('admin.set.s3.save') }}
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
