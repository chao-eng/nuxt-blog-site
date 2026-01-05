<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

const { t } = useI18n()

const enableUmami = ref(false)
const scriptUrl = ref('')
const websiteId = ref('')
const shareUrl = ref('')

const loading = ref(false)
const saving = ref(false)
const toast = useToast()

// 加载配置
async function loadConfig() {
  loading.value = true
  try {
    const response: any = await $fetch('/api/umami/config')
    if (response.success && response.data) {
      const config = response.data
      enableUmami.value = config.enableUmami
      scriptUrl.value = config.scriptUrl
      websiteId.value = config.websiteId
      shareUrl.value = config.shareUrl || ''
    }
  } catch (error: any) {
    toast.add({
      title: t('admin.set.umami.loadFailed'),
      description: error.message || t('admin.set.umami.loadError'),
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// 保存配置
async function saveConfig() {
  if (enableUmami.value && (!scriptUrl.value || !websiteId.value)) {
    toast.add({
      title: t('admin.set.umami.incompleteConfig'),
      description: t('admin.set.umami.allFieldsRequired'),
      color: 'red'
    })
    return
  }

  saving.value = true
  try {
    await $fetch('/api/umami/config', {
      method: 'POST',
      body: {
        enableUmami: enableUmami.value,
        scriptUrl: scriptUrl.value,
        websiteId: websiteId.value,
        shareUrl: shareUrl.value
      }
    })

    toast.add({
      title: t('admin.set.umami.saveSuccess'),
      description: t('admin.set.umami.configUpdated'),
      color: 'green'
    })
  } catch (error: any) {
    toast.add({
      title: t('admin.set.umami.saveFailed'),
      description: error.message || t('admin.set.umami.saveError'),
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
          <h1 class="text-2xl font-bold">
            {{ t('admin.set.umami.title') }}
          </h1>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            :loading="loading"
            @click="loadConfig"
          >
            {{ t('admin.set.umami.refresh') }}
          </UButton>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Umami 配置 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ t('admin.set.umami.basicConfig') }}
            </h3>
            <a href="https://umami.is/" target="_blank" class="text-sm text-primary hover:underline">
              {{ t('admin.set.umami.officialWebsite') }} &rarr;
            </a>
          </div>

          <UAlert
            icon="i-lucide-info"
            color="blue"
            variant="soft"
            :title="t('admin.set.umami.configInstructions')"
            :description="t('admin.set.umami.configInstructionsDesc')"
          />

          <div class="space-y-4">
            <UFormField :label="t('admin.set.umami.enableUmami')" class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <USwitch v-model="enableUmami" />
            </UFormField>

            <UFormField :label="t('admin.set.umami.scriptUrl')" :required="enableUmami" class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="scriptUrl" :placeholder="t('admin.set.umami.scriptUrlPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.umami.websiteId')" :required="enableUmami" class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="websiteId" :placeholder="t('admin.set.umami.websiteIdPlaceholder')" class="w-full" />
            </UFormField>

            <UFormField :label="t('admin.set.umami.shareUrl')" class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <UInput v-model="shareUrl" :placeholder="t('admin.set.umami.shareUrlPlaceholder')" class="w-full" />
              <p class="text-xs text-gray-500 col-start-2">
                {{ t('admin.set.umami.shareUrlDesc') }}
              </p>
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
            {{ t('admin.set.umami.cancel') }}
          </UButton>
          <UButton
            color="primary"
            :loading="saving"
            @click="saveConfig"
          >
            {{ t('admin.set.umami.save') }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
