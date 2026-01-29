<script setup lang="ts">
import * as z from 'zod'
import type { FormError } from '@nuxt/ui'
import type { Result } from '~/types'

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
  <div class="space-y-12 pb-20">
    <!-- 密码修改部分 -->
    <div class="space-y-6">
      <div class="flex items-center gap-2 px-2">
        <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
        <h2 class="text-sm font-black text-gray-400 uppercase tracking-widest">{{ t('admin.set.security.password') }}</h2>
      </div>

      <div class="settings-section-card glass-morphism p-6 lg:p-10">
        <div class="flex flex-col md:flex-row gap-10">
          <div class="flex-1 space-y-2">
            <h3 class="text-lg font-black text-gray-900 dark:text-white">{{ t('admin.set.security.setNewPassword') }}</h3>
            <p class="text-xs text-gray-500 font-medium leading-relaxed">
              请确保您的新密码具有足够的复杂度，包含大写字母、数字和特殊符号。
            </p>
          </div>

          <UForm
            :schema="passwordSchema"
            :state="password"
            :validate="validate"
            class="flex-1 flex flex-col gap-6"
            @submit="repassword"
          >
            <UFormField name="current" class="cyber-field" :label="t('admin.set.security.currentPassword')">
              <UInput
                v-model="password.current"
                type="password"
                size="xl"
                variant="none"
                class="cyber-input-minimal"
                icon="i-lucide-lock"
              />
            </UFormField>

            <UFormField name="new" class="cyber-field" :label="t('admin.set.security.newPassword')">
              <UInput
                v-model="password.new"
                type="password"
                size="xl"
                variant="none"
                class="cyber-input-minimal"
                icon="i-lucide-shield-check"
              />
            </UFormField>

            <div class="pt-2">
              <UButton 
                type="submit"
                color="primary"
                class="action-btn-glow h-11 px-8 rounded-xl font-bold uppercase tracking-widest transition-all"
              >
                {{ t('admin.set.security.confirm') }}
              </UButton>
            </div>
          </UForm>
        </div>
      </div>
    </div>

    <!-- 危险区域部分 -->
    <div class="space-y-6">
      <div class="flex items-center gap-2 px-2">
        <div class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
        <h2 class="text-sm font-black text-red-400 uppercase tracking-widest">Danger Zone</h2>
      </div>

      <div class="danger-section-card p-6 lg:p-10 border border-red-500/20 bg-red-500/5 backdrop-blur-md rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="space-y-2 text-center md:text-left">
          <h3 class="text-lg font-black text-red-500">{{ t('admin.set.security.deleteAccount') }}</h3>
          <p class="text-xs text-red-400/80 font-medium max-w-md">
            {{ t('admin.set.security.deleteAccountDesc') }}
          </p>
        </div>
        <UButton 
          :label="t('admin.set.security.deleteAccountButton')" 
          color="error" 
          variant="soft"
          class="h-11 px-8 rounded-xl font-bold uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
        />
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
  padding: 0.85rem 1rem !important;
  padding-left: 2.75rem !important;
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
