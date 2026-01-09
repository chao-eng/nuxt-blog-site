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
        publicUrl: publicUrl.value
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
  <div class="container mx-auto p-6 max-w-6xl">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">
            {{ t('admin.set.s3.title') }}
          </h1>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            :loading="loading"
            @click="loadConfig"
          >
            {{ t('admin.set.s3.refresh') }}
          </UButton>
        </div>
      </template>

      <div class="space-y-6">
        <!-- 开启/关闭 S3 -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ t('admin.set.s3.enableS3') }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('admin.set.s3.enableS3Desc') }}
            </p>
          </div>
          <USwitch v-model="enableS3" />
        </div>

        <USeparator />

        <!-- S3 配置 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ t('admin.set.s3.basicConfig') }}
            </h3>
          </div>

          <UAlert
            icon="i-lucide-info"
            color="primary"
            variant="soft"
            :title="t('admin.set.s3.configInstructions')"
            :description="t('admin.set.s3.configInstructionsDesc')"
          />

          <div class="space-y-4">
            <UFormField :label="t('admin.set.s3.accessKeyId')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="accessKeyId" :placeholder="t('admin.set.s3.accessKeyIdPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.s3.secretAccessKey')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="secretAccessKey" type="password" :placeholder="t('admin.set.s3.secretAccessKeyPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.s3.region')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="region" :placeholder="t('admin.set.s3.regionPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.s3.bucket')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="bucket" :placeholder="t('admin.set.s3.bucketPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.s3.endpoint')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="endpoint" :placeholder="t('admin.set.s3.endpointPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.s3.publicUrl')" required class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="publicUrl" :placeholder="t('admin.set.s3.publicUrlPlaceholder')" class="w-full" />
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
            {{ t('admin.set.s3.cancel') }}
          </UButton>
          <UButton
            color="primary"
            :loading="saving"
            @click="saveConfig"
          >
            {{ t('admin.set.s3.save') }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
