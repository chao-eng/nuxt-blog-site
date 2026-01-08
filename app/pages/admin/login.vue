<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative">
    <!-- 语言切换按钮 - 右上角 -->
    <div class="absolute top-4 right-4">
      <UDropdownMenu
        :items="languageItems"
        :ui="{ content: 'w-40' }"
      >
        <UButton
          icon="i-lucide-languages"
          variant="ghost"
          size="lg"
          trailing
        >
          {{ currentLocaleName }}
        </UButton>
      </UDropdownMenu>
    </div>

    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('login.title') }}
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {{ t('login.subtitle') }}
          </p>
        </div>
      </template>

      <UForm
        ref="form"
        :schema="schema"
        :state="loginForm"
        :validate-on="['blur', 'change', 'input']"
        class="space-y-4"
        @submit="handleLogin"
        @error="onError"
      >
        <UFormField
          :label="t('login.username')"
          name="username"
        >
          <UInput
            v-model="loginForm.username"
            :placeholder="t('login.usernamePlaceholder')"
            icon="i-heroicons-user"
            size="lg"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="t('login.password')"
          name="password"
        >
          <UInput
            v-model="loginForm.password"
            type="password"
            :placeholder="t('login.passwordPlaceholder')"
            icon="i-heroicons-lock-closed"
            size="lg"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <!-- 错误提示 -->
        <UAlert
          v-if="error"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="error"
          :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'neutral', variant: 'link', size: '2xs' }"
          @close="error = ''"
        />

        <!-- 登录按钮 -->
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          size="lg"
          block
          :loading="loading"
          :disabled="loading"
        >
          {{ loading ? t('login.loggingIn') : t('login.loginButton') }}
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const localePath = useLocalePath()
// 页面元信息
definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/'
  },
  layout: false // 使用自定义布局
})

const { t, locale, setLocale } = useI18n()

// 页面标题
useHead({
  title: computed(() => t('login.title'))
})

// 表单验证 schema - 使用 computed 确保错误消息能响应语言切换
const schema = computed(() => z.object({
  username: z.string()
    .min(1, t('login.validation.usernameRequired'))
    .min(3, t('login.validation.usernameMin')),
  password: z.string()
    .min(1, t('login.validation.passwordRequired'))
    .min(6, t('login.validation.passwordMin'))
}))

type Schema = z.output<typeof schema.value>

// 组合式 API
const { signIn } = useAuth()
const toast = useToast()

// 语言切换逻辑
const currentLocaleName = computed(() => {
  return locale.value === 'zh-CN' ? '简体中文' : 'English'
})

const switchLanguage = (lang: string) => {
  setLocale(lang as 'en' | 'zh-CN')
}

const languageItems = computed(() => [[
  {
    label: 'English',
    icon: 'i-circle-flags-us',
    onClick: () => switchLanguage('en')
  },
  {
    label: '简体中文',
    icon: 'i-circle-flags-cn',
    onClick: () => switchLanguage('zh-CN')
  }
]])

// 响应式数据
const form = ref()
const loading = ref(false)
const error = ref('')

// 表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 表单错误
const formErrors = reactive({
  username: '',
  password: ''
})

function onError(event: any) {
  const errors = event.errors || []
  if (errors.length > 0) {
    const element = document.getElementById(errors[0].path)
    element?.focus()
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 登录处理函数
async function handleLogin(event: FormSubmitEvent<Schema>) {
  loading.value = true
  error.value = ''

  // 清除之前的错误
  formErrors.username = ''
  formErrors.password = ''

  try {
    const result = await signIn(event.data, {
      callbackUrl: localePath('/admin')
    })

    if (result?.error) {
      error.value = result.error
      toast.add({
        title: t('login.loginFailed'),
        description: result.error,
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle'
      })
    } else {
      // 登录成功
      toast.add({
        title: t('login.loginSuccess'),
        description: t('login.welcome'),
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }
  } catch (err: unknown) {
    console.error('登录错误:', err)
    const errorMsg = (err as { message?: string }).message || t('login.validation.networkError')
    const statusCode = (err as { statusCode?: number }).statusCode

    // 处理不同类型的错误
    if (statusCode === 401) {
      error.value = t('login.validation.invalidCredentials')
      formErrors.username = t('login.validation.checkUsername')
      formErrors.password = t('login.validation.checkPassword')
    } else if (statusCode === 400) {
      error.value = t('login.validation.badRequest')
    } else if (statusCode && statusCode >= 500) {
      error.value = t('login.validation.serverError')
    } else {
      error.value = errorMsg
    }

    toast.add({
      title: t('login.loginFailed'),
      description: error.value,
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
      duration: 5000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 自定义样式（如果需要） */
.login-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .login-card {
    margin: 1rem;
  }
}
</style>
