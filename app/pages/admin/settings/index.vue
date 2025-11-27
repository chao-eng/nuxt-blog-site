<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Result } from '../../types'

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
  name: (data.value as any)?.name,
  email: (data.value as any)?.email,
  username: (data.value as any)?.username,
  avatar: (data.value as any)?.avatar,
  bio: (data.value as any)?.bio
})
const toast = useToast()
async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
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
    @submit="onSubmit"
  >
    <UPageCard
      :title="t('admin.set.account.config')"
      :description="t('admin.set.account.publicInfo')"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        :label="t('admin.set.account.save')"
        color="neutral"
        type="submit"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="name"
        :label="t('admin.set.account.nickname')"
        :description="t('admin.set.account.nicknameDesc')"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.name"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="email"
        :label="t('admin.set.account.email')"
        :description="t('admin.set.account.emailDesc')"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.email"
          type="email"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="username"
        :label="t('admin.set.account.username')"
        :description="t('admin.set.account.usernameDesc')"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.username"
          type="username"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="avatar"
        :label="t('admin.set.account.avatar')"
        :description="t('admin.set.account.avatarDesc')"
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <UAvatar
            :src="profile.avatar"
            :alt="profile.name"
            size="lg"
          />
          <UButton
            :label="t('admin.set.account.select')"
            color="neutral"
            @click="onFileClick"
          />
          <input
            ref="fileRef"
            type="file"
            class="hidden"
            accept=".jpg, .jpeg, .png, .gif"
            @change="onFileChange"
          >
        </div>
      </UFormField>
      <USeparator />
      <UFormField
        name="bio"
        :label="t('admin.set.account.bio')"
        :description="t('admin.set.account.bioDesc')"
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="profile.bio"
          :rows="5"
          autoresize
          class="w-full"
        />
      </UFormField>
    </UPageCard>
  </UForm>
</template>
