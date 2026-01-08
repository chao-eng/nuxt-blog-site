<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const appConfig = useAppConfig()

const colors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const { signOut, data } = useAuth()
interface SessionUser {
  name?: string
  avatar?: string
  email?: string
}

const user = computed(() => {
  const sessionUser = data.value as SessionUser | null
  return {
    name: sessionUser?.name ?? 'Guest',
    avatar: {
      src: sessionUser?.avatar ?? 'https://avatars.githubusercontent.com/u/904724?v=4',
      alt: sessionUser?.name ?? 'Guest'
    }
  }
})

const { t, locale, setLocale } = useI18n()

const localePath = useLocalePath()

const items = computed<DropdownMenuItem[]>(() => ([[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar
}], [{
  label: t('admin.settings'),
  icon: 'i-lucide-settings',
  to: localePath('/admin/settings')
}], [{
  label: t('admin.theme'),
  icon: 'i-lucide-palette',
  children: [{
    label: 'Primary',
    slot: 'chip',
    chip: appConfig.ui.colors.primary,
    content: {
      align: 'center',
      collisionPadding: 16
    },
    children: colors.map(color => ({
      label: color,
      chip: color,
      slot: 'chip',
      checked: appConfig.ui.colors.primary === color,
      type: 'checkbox',
      onSelect: (e: Event) => {
        e.preventDefault()

        appConfig.ui.colors.primary = color
      }
    }))
  }, {
    label: 'Neutral',
    slot: 'chip',
    chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
    content: {
      align: 'end',
      collisionPadding: 16
    },
    children: neutrals.map(color => ({
      label: color,
      chip: color === 'neutral' ? 'old-neutral' : color,
      slot: 'chip',
      type: 'checkbox',
      checked: appConfig.ui.colors.neutral === color,
      onSelect: (e: Event) => {
        e.preventDefault()

        appConfig.ui.colors.neutral = color
      }
    }))
  }]
}, {
  label: t('admin.appearance'),
  icon: 'i-lucide-sun-moon',
  children: [{
    label: t('admin.light'),
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()

      colorMode.preference = 'light'
    }
  }, {
    label: t('admin.dark'),
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onUpdateChecked(checked: boolean) {
      if (checked) {
        colorMode.preference = 'dark'
      }
    },
    onSelect(e: Event) {
      e.preventDefault()
    }
  }]
}, {
  label: t('admin.language'),
  icon: 'i-lucide-languages',
  children: [{
    label: t('admin.english'),
    type: 'checkbox',
    checked: locale.value === 'en',
    onSelect(e: Event) {
      e.preventDefault()
      setLocale('en')
    }
  }, {
    label: t('admin.chinese'),
    type: 'checkbox',
    checked: locale.value === 'zh-CN',
    onSelect(e: Event) {
      e.preventDefault()
      setLocale('zh-CN')
    }
  }]
}], [{
  label: t('admin.logout'),
  icon: 'i-lucide-log-out',
  onSelect() {
    // console.log('退出登录')
    const handleSignOut = async () => {
      try {
        await signOut({
          callbackUrl: '/',
          redirect: false // 阻止自动重定向
        })
        // 手动重定向到内部页面
        await navigateTo('/')
      } catch (error) {
        console.error('登出失败:', error)
      }
    }
    handleSignOut()
  }
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as DropdownMenuItem & { chip: string }).chip}-500)`,
            '--chip-dark': `var(--color-${(item as DropdownMenuItem & { chip: string }).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
