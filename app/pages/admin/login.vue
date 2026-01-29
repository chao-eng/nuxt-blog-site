<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const localePath = useLocalePath()

definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/'
  },
  layout: false
})

const { t, locale, setLocale } = useI18n()

useHead({
  title: computed(() => t('login.title'))
})

// 表单验证 schema
const schema = computed(() => z.object({
  username: z.string()
    .min(1, t('login.validation.usernameRequired'))
    .min(3, t('login.validation.usernameMin')),
  password: z.string()
    .min(1, t('login.validation.passwordRequired'))
    .min(6, t('login.validation.passwordMin'))
}))

type Schema = z.output<typeof schema.value>

const { signIn } = useAuth()
const toast = useToast()

// 语言切换
const currentLocaleName = computed(() => {
  return locale.value === 'zh-CN' ? '简体中文' : 'English'
})

const switchLanguage = (lang: string) => {
  setLocale(lang as 'en' | 'zh-CN')
}

const languageItems = computed(() => [[
  {
    label: 'English',
    icon: 'i-lucide-globe',
    onClick: () => switchLanguage('en')
  },
  {
    label: '简体中文',
    icon: 'i-lucide-languages',
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

// 登录处理
async function handleLogin(event: FormSubmitEvent<Schema>) {
  loading.value = true
  error.value = ''
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

<template>
  <div class="login-page">
    <!-- 语言切换 -->
    <div class="language-switcher">
      <UDropdownMenu
        :items="languageItems"
        :ui="{ content: 'w-40' }"
      >
        <UButton
          icon="i-lucide-languages"
          variant="ghost"
          size="lg"
          trailing
          class="text-white hover:bg-white/10"
        >
          {{ currentLocaleName }}
        </UButton>
      </UDropdownMenu>
    </div>

    <div class="login-container">
      <!-- 左侧装饰区域 -->
      <div class="login-decoration">
        <!-- 装饰图形 - 移到 content 之外，通过 absolute 定位 -->
        <div class="decoration-shapes">
          <div class="shape shape-1" />
          <div class="shape shape-2" />
          <div class="shape shape-3" />
        </div>

        <div class="decoration-content">
          <!-- Logo 和标题 -->
          <div class="brand-section">
            <div class="brand-icon-wrapper">
              <Icon name="i-lucide-sparkles" class="brand-icon" />
            </div>
            <h1 class="brand-title">{{ t('login.title') }}</h1>
            <p class="brand-subtitle">{{ t('login.subtitle') }}</p>
          </div>

          <!-- 特性列表 -->
          <div class="features-list">
            <div class="feature-item">
              <Icon name="i-lucide-shield-check" class="feature-icon" />
              <span>{{ t('login.secure') }}</span>
            </div>
            <div class="feature-item">
              <Icon name="i-lucide-zap" class="feature-icon" />
              <span>{{ t('login.fast') }}</span>
            </div>
            <div class="feature-item">
              <Icon name="i-lucide-heart" class="feature-icon" />
              <span>{{ t('login.friendly') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form-section">
        <div class="login-card">
          <!-- 表单头部 -->
          <div class="form-header">
            <h2 class="form-title">{{ t('login.welcomeBack') }}</h2>
            <p class="form-description">{{ t('login.enterCredentials') }}</p>
          </div>

          <!-- 登录表单 -->
          <UForm
            ref="form"
            :schema="schema"
            :state="loginForm"
            :validate-on="['blur', 'change', 'input']"
            class="login-form"
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
                icon="i-lucide-user"
                size="xl"
                :disabled="loading"
                class="form-input"
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
                icon="i-lucide-lock"
                size="xl"
                :disabled="loading"
                class="form-input"
              />
            </UFormField>

            <!-- 错误提示 -->
            <UAlert
              v-if="error"
              icon="i-lucide-alert-circle"
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
              size="xl"
              block
              :loading="loading"
              :disabled="loading"
              class="login-button"
            >
              <template #leading>
                <Icon v-if="!loading" name="i-lucide-log-in" class="button-icon" />
              </template>
              {{ loading ? t('login.loggingIn') : t('login.loginButton') }}
            </UButton>
          </UForm>

          <!-- 表单底部 -->
          <div class="form-footer">
            <p class="footer-text">
              {{ t('login.poweredBy') }} 
              <span class="gradient-text font-bold">Nuxt 3</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 登录页面容器 ===== */
.login-page {
  min-height: 100vh;
  position: relative;
  background: radial-gradient(circle at top left, #6366f1 0%, #4338ca 40%, #1e1b4b 100%);
  overflow: hidden;
}

.dark .login-page {
  background: radial-gradient(circle at top left, #4338ca 0%, #1e1b4b 50%, #09090b 100%);
}

/* ===== 语言切换器 ===== */
.language-switcher {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 20;
}

/* ===== 登录容器 ===== */
.login-container {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  min-height: 100vh;
  position: relative;
}

@media (max-width: 1024px) {
  .login-container {
    grid-template-columns: 1fr;
  }
}

/* ===== 左侧装饰区域 ===== */
.login-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  position: relative;
}

@media (max-width: 1024px) {
  .login-decoration {
    display: none;
  }
}

.decoration-content {
  position: relative;
  z-index: 10;
  max-width: 36rem;
  width: 100%;
  animation: fadeIn 1s ease-out;
}

/* 装饰图形 */
.decoration-shapes {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  mix-blend-mode: overlay;
}

.shape-1 {
  width: 45rem;
  height: 45rem;
  top: -15rem;
  left: -15rem;
  animation: pulse-slow 10s ease-in-out infinite;
}

.shape-2 {
  width: 30rem;
  height: 30rem;
  bottom: -5rem;
  right: -5rem;
  animation: pulse-slow 12s ease-in-out infinite 1s;
}

.shape-3 {
  width: 20rem;
  height: 20rem;
  top: 15%;
  right: 15%;
  animation: pulse-slow 15s ease-in-out infinite 2s;
}

@keyframes pulse-slow {
  0%, 100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1) translate(30px, -30px);
    opacity: 0.6;
  }
}

/* 品牌区域 */
.brand-section {
  margin-bottom: 5rem;
}

.brand-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 6.5rem;
  height: 6.5rem;
  border-radius: 2.25rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-20px) rotate(4deg); }
}

.brand-icon {
  width: 3.5rem;
  height: 3.5rem;
  color: white;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
}

.brand-title {
  font-size: 4.5rem;
  font-weight: 900;
  color: white;
  margin-bottom: 1rem;
  letter-spacing: -0.05em;
  line-height: 1;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.brand-subtitle {
  font-size: 1.75rem;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* 特性列表 */
.features-list {
  display: grid;
  gap: 1.5rem;
  max-width: 22rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem;
  color: white;
  font-size: 1.125rem;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: slideInLeft 0.8s ease-out;
  animation-fill-mode: both;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(12px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
}

.feature-item:nth-child(1) { animation-delay: 0.4s; }
.feature-item:nth-child(2) { animation-delay: 0.6s; }
.feature-item:nth-child(3) { animation-delay: 0.8s; }

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-60px); }
  to { opacity: 1; transform: translateX(0); }
}

.feature-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: #a5b4fc;
}

/* ===== 右侧表单区域 ===== */
.login-form-section {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  position: relative;
  z-index: 10;
}

@media (max-width: 640px) {
  .login-form-section {
    padding: 1.25rem;
  }
}

.login-card {
  width: 100%;
  max-width: 32rem;
  padding: 4rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 3rem;
  box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.5);
  animation: slideInRight 1.2s cubic-bezier(0.23, 1, 0.32, 1);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.dark .login-card {
  background: rgba(24, 24, 27, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 640px) {
  .login-card {
    padding: 3rem 1.5rem;
    border-radius: 2rem;
  }
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(60px); }
  to { opacity: 1; transform: translateX(0); }
}

.form-header {
  text-align: center;
  margin-bottom: 3.5rem;
}

.form-title {
  font-size: 2.75rem;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 0.75rem;
  letter-spacing: -0.04em;
}

.dark .form-title {
  color: white;
}

.form-description {
  font-size: 1.125rem;
  color: #64748b;
  font-weight: 500;
}

/* 登录表单 */
.login-form {
  display: grid;
  gap: 1.5rem;
}

.form-input {
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 强制内部所有包裹层撑满 */
.form-input :deep(.base-input),
.form-input :deep(.base-input-wrapper),
.form-input :deep(input) {
  width: 100% !important;
}

/* 优化 Label 样式 */
.login-form :deep(.base-form-field-label) {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
}

.dark .login-form :deep(.base-form-field-label) {
  color: #94a3b8;
}

/* 核心输入框重塑 */
.form-input :deep(input) {
  border-radius: 1.25rem;
  height: 3.75rem;
  font-size: 1rem;
  padding-left: 3rem !important; /* 为图标留出更多空间 */
  background: rgba(248, 250, 252, 0.8) !important;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.dark .form-input :deep(input) {
  background: rgba(39, 39, 42, 0.6) !important;
  border-color: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 输入框图标定位优化 */
.form-input :deep(.base-input-icon) {
  left: 1rem;
  color: #94a3b8;
  transition: color 0.3s ease;
}

/* Focus 交互状态 - 呼吸光晕 */
.form-input:focus-within {
  transform: translateY(-2px);
}

.form-input :deep(input:focus) {
  background: white !important;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), 0 10px 15px -3px rgba(99, 102, 241, 0.1);
}

.dark .form-input :deep(input:focus) {
  background: rgba(39, 39, 42, 0.9) !important;
  border-color: #818cf8;
  box-shadow: 0 0 0 4px rgba(129, 140, 248, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.3);
}

.form-input:focus-within :deep(.base-input-icon) {
  color: #6366f1;
}

/* 登录按钮 - 深度统一色调 */
.login-button {
  height: 4.25rem;
  font-size: 1.125rem;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border: none;
  border-radius: 1.25rem;
  box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin-top: 1rem;
  color: white;
}

.login-button:hover {
  transform: translateY(-4px) scale(1.01);
  background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  box-shadow: 0 20px 35px -10px rgba(79, 70, 229, 0.5);
}

.login-button:active {
  transform: translateY(0) scale(0.98);
}

/* 底部页脚美化 */
.form-footer {
  margin-top: 3.5rem;
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 2rem;
}

.dark .form-footer {
  border-top-color: rgba(255, 255, 255, 0.05);
}

.footer-text {
  font-size: 0.875rem;
  color: #94a3b8;
  letter-spacing: 0.02em;
}
</style>
