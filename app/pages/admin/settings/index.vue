<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Result } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

const { t } = useI18n()

const fileRef = ref<HTMLInputElement>()

const profileSchema = z.object({
  name: z.string().min(2, t('admin.set.account.minTwoChars')),
  email: z.string().email(t('admin.set.account.emailFormatError')),
  username: z.string().min(5, t('admin.set.account.minFiveChars')),
  avatar: z.string().optional(),
  bio: z.string().optional()
})

type ProfileSchema = z.output<typeof profileSchema>

// 查询当前登录用户
const { data } = useAuth()

const profile = reactive<Partial<ProfileSchema>>({
  name: (data.value as { name?: string })?.name,
  email: (data.value as { email?: string })?.email,
  username: (data.value as { username?: string })?.username,
  avatar: (data.value as { avatar?: string })?.avatar,
  bio: (data.value as { bio?: string })?.bio
})
const toast = useToast()
async function onSubmit(_event: FormSubmitEvent<ProfileSchema>) {
  const result: Result<undefined> = await $fetch('/api/user/profile', {
    method: 'POST',
    body: profile
  })
  // console.log(data)
  if (result.success) {
    toast.add({
      title: t('admin.set.account.configUpdated'),
      icon: 'i-lucide-check',
      color: 'success'
    })
  } else {
    toast.add({
      title: t('admin.set.account.configUpdateFailed'),
      description: result.err,
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

const { uploadImage } = useUpload()

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }
  const result = await uploadImage(input.files[0]!)
  // console.log('图片链接:',result)

  if (result) {
    // 上传成功
    profile.avatar = result
  } else {
    // 清空 input
    if (profile.avatar) {
      profile.avatar = ''
    }
  }
}

function onFileClick() {
  fileRef.value?.click()
}
</script>

<template>
  <UForm
    id="settings"
    :schema="profileSchema"
    :state="profile"
    class="space-y-8"
    @submit="onSubmit"
  >
    <!-- 顶部操作栏 -->
    <div class="flex items-center justify-between px-2">
      <div class="flex flex-col gap-1">
        <h2 class="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">{{ t('admin.set.account.config') }}</h2>
        <p class="text-xs text-gray-500 font-bold uppercase tracking-wider opacity-70">{{ t('admin.set.account.publicInfo') }}</p>
      </div>
      <UButton
        form="settings"
        type="submit"
        color="primary"
        class="action-btn-glow h-11 px-8 rounded-xl font-bold uppercase tracking-widest transition-all"
      >
        {{ t('admin.set.account.save') }}
      </UButton>
    </div>

    <!-- 账户设置卡片 -->
    <div class="settings-section-card glass-morphism p-6 lg:p-10 space-y-10">
      <!-- 头像上传区域 -->
      <section class="flex flex-col sm:flex-row sm:items-center gap-8">
        <div class="relative group mx-auto sm:mx-0">
          <div class="absolute -inset-1.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-40 blur-md transition-opacity duration-500" />
          <UAvatar
            :src="profile.avatar"
            :alt="profile.name"
            size="3xl"
            class="relative ring-4 ring-white dark:ring-slate-900 shadow-2xl"
          />
          <div class="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg transform translate-x-1 translate-y-1">
            <UIcon name="i-lucide-camera" class="w-4 h-4 text-white" />
          </div>
        </div>
        
        <div class="flex flex-col gap-3 flex-1">
          <h3 class="text-sm font-black text-gray-400 uppercase tracking-widest">{{ t('admin.set.account.avatar') }}</h3>
          <p class="text-xs text-gray-500 font-medium max-w-sm">{{ t('admin.set.account.avatarDesc') }}</p>
          <div class="flex items-center gap-3 mt-1">
            <UButton
              :label="t('admin.set.account.select')"
              variant="soft"
              color="primary"
              class="rounded-xl font-bold px-5"
              @click="onFileClick"
            />
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">MAX 2MB • JPG PNG GIF</span>
            <input
              ref="fileRef"
              type="file"
              class="hidden"
              accept=".jpg, .jpeg, .png, .gif"
              @change="onFileChange"
            >
          </div>
        </div>
      </section>

      <div class="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />

      <!-- 信息表单栅格 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        <UFormField
          name="name"
          :label="t('admin.set.account.nickname')"
          :description="t('admin.set.account.nicknameDesc')"
          required
          class="cyber-field"
        >
          <UInput
            v-model="profile.name"
            size="xl"
            variant="none"
            class="cyber-input-minimal"
            autocomplete="off"
          />
        </UFormField>

        <UFormField
          name="username"
          :label="t('admin.set.account.username')"
          :description="t('admin.set.account.usernameDesc')"
          required
          class="cyber-field"
        >
          <UInput
            v-model="profile.username"
            size="xl"
            variant="none"
            class="cyber-input-minimal"
            autocomplete="off"
          />
        </UFormField>

        <UFormField
          name="email"
          :label="t('admin.set.account.email')"
          :description="t('admin.set.account.emailDesc')"
          required
          class="md:col-span-2 cyber-field"
        >
          <UInput
            v-model="profile.email"
            type="email"
            size="xl"
            variant="none"
            class="cyber-input-minimal"
            autocomplete="off"
          />
        </UFormField>

        <UFormField
          name="bio"
          :label="t('admin.set.account.bio')"
          :description="t('admin.set.account.bioDesc')"
          class="md:col-span-2 cyber-field"
          :ui="{ container: 'w-full' }"
        >
          <UTextarea
            v-model="profile.bio"
            :rows="4"
            variant="none"
            autoresize
            class="cyber-input-minimal w-full font-sans leading-relaxed"
          />
        </UFormField>
      </div>
    </div>
  </UForm>
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
  transform: translateY(-2px) scale(1.02);
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

.cyber-input-minimal :deep(input),
.cyber-input-minimal :deep(textarea) {
  background: rgba(0, 0, 0, 0.03) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  border-radius: 1.25rem !important;
  padding: 0.85rem 1.25rem !important;
  transition: all 0.3s ease !important;
  font-weight: 600 !important;
}

.dark .cyber-input-minimal :deep(input),
.dark .cyber-input-minimal :deep(textarea) {
  background: rgba(255, 255, 255, 0.02) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

.cyber-input-minimal:focus-within :deep(input),
.cyber-input-minimal:focus-within :deep(textarea) {
  background: white !important;
  border-color: #6366f1 !important;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
  transform: translateY(-1px);
}

.dark .cyber-input-minimal:focus-within :deep(input),
.dark .cyber-input-minimal:focus-within :deep(textarea) {
  background: rgba(30, 41, 59, 0.5) !important;
}
</style>
