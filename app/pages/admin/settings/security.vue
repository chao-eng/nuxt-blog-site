<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { Result } from '../../types'

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

const { t } = useI18n()

const passwordSchema = computed(() => z.object({
  current: z.string().min(6, t('admin.set.security.passwordMinLength')),
  new: z.string().min(6, t('admin.set.security.passwordMinLength'))
}))

type PasswordSchema = z.output<typeof passwordSchema.value>

const password = reactive<Partial<PasswordSchema>>({
  current: undefined,
  new: undefined
})

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []
  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: t('admin.set.security.passwordMustDifferent') })
  }
  return errors
}
const toast = useToast()
const repassword = async () => {
  const result: Result<string> = await $fetch('/api/auth/repassword', {
    method: 'POST',
    body: { currPassword: password.current, newPassword: password.new }
  })
  if (result.success) {
    toast.add({
      title: t('admin.set.security.passwordChangeSuccess'),
      description: result.data,
      color: 'success'
    })
    password.current = ''
    password.new = ''
  } else {
    toast.add({
      title: t('admin.set.security.passwordChangeFailed'),
      description: result.err,
      color: 'error'
    })
  }
}
</script>

<template>
  <UPageCard
    :title="t('admin.set.security.password')"
    :description="t('admin.set.security.setNewPassword')"
    variant="subtle"
  >
    <UForm
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
      @submit="repassword"
    >
      <UFormField name="current">
        <UInput
          v-model="password.current"
          type="password"
          :placeholder="t('admin.set.security.currentPassword')"
          class="w-full"
        />
      </UFormField>

      <UFormField name="new">
        <UInput
          v-model="password.new"
          type="password"
          :placeholder="t('admin.set.security.newPassword')"
          class="w-full"
        />
      </UFormField>

      <UButton :label="t('admin.set.security.confirm')" class="w-fit" type="submit" />
    </UForm>
  </UPageCard>

  <UPageCard
    :title="t('admin.set.security.deleteAccount')"
    :description="t('admin.set.security.deleteAccountDesc')"
    class="bg-gradient-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UButton :label="t('admin.set.security.deleteAccountButton')" color="error" />
    </template>
  </UPageCard>
</template>
