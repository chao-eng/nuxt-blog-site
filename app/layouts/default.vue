<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

// 侧边栏展开状态（初始值确保服务端/客户端一致）
const open = ref(false)

const { t } = useI18n()
const localePath = useLocalePath()

const links = computed(() => [
  {
    label: t('admin.dashboard'),
    icon: 'i-lucide-layout-dashboard',
    to: localePath('/admin'),
    exact: true,
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: t('admin.articles'),
    icon: 'i-lucide-newspaper',
    to: localePath('/admin/article'),
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: t('admin.travel'),
    icon: 'i-lucide-map-pin',
    to: localePath('/admin/travel'),
    onSelect: () => {
      open.value = false
    }
  },
  {
    label: t('admin.settings'),
    to: localePath('/admin/settings'),
    icon: 'i-lucide-settings',
    defaultOpen: true,
    type: 'trigger',
    children: [{
      label: t('admin.account'),
      to: localePath('/admin/settings'),
      exact: true,
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: t('admin.security'),
      to: localePath('/admin/settings/security'),
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: t('admin.comments'),
      to: localePath('/admin/settings/comments'),
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: t('admin.umami'),
      to: localePath('/admin/settings/umami'),
      onSelect: () => {
        open.value = false
      }
    }]
  },
  {
    label: t('admin.backHome'),
    icon: 'i-lucide-house',
    to: localePath('/'),
    onSelect: () => {
      open.value = false
    }
  }
])

// 搜索分组配置（确保结构符合 UDashboardSearch 要求）
// 完全自定义的搜索组配置
const groups = computed(() => [
  {
    id: 'pages',
    label: t('nav.admin'),
    items: [
      {
        id: 'dashboard',
        label: t('admin.dashboard'),
        icon: 'i-lucide-layout-dashboard',
        to: localePath('/admin'),
        shortcut: ['⌘', 'D']
      },
      {
        id: 'articles',
        label: t('admin.articles'),
        icon: 'i-lucide-newspaper',
        to: localePath('/admin/article'),
        shortcut: ['⌘', 'A']
      },
      {
        id: 'travel',
        label: t('admin.travel'),
        icon: 'i-lucide-map-pin',
        to: localePath('/admin/travel'),
        shortcut: ['⌘', 'T']
      },
      {
        id: 'home',
        label: t('admin.backHome'),
        icon: 'i-lucide-house',
        to: localePath('/'),
        shortcut: ['⌘', 'H']
      }
    ]
  },
  {
    id: 'settings',
    label: t('admin.settings'),
    items: [
      {
        id: 'general-settings',
        label: t('admin.account'),
        icon: 'i-lucide-settings',
        to: localePath('/admin/settings')
      },
      {
        id: 'account-settings',
        label: t('admin.security'),
        icon: 'i-lucide-user',
        to: localePath('/admin/settings/security')
      },
      {
        id: 'comment-settings',
        label: t('admin.comments'),
        icon: 'i-lucide-message-square',
        to: localePath('/admin/settings/comments')
      },
      {
        id: 'umami-settings',
        label: t('admin.umami'),
        icon: 'i-lucide-bar-chart',
        to: localePath('/admin/settings/umami')
      }
    ]
  },
  {
    id: 'actions',
    label: '快捷操作',
    items: [
      {
        id: 'toggle-theme',
        label: t('admin.theme'),
        icon: 'i-lucide-sun-moon',
        onSelect: () => {
          const colorMode = useColorMode()
          colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
        }
      }
    ]
  }
])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  // 使用解构获取 toast 的 id
  const { id: consentToastId } = toast.add({
    title: '使用 Cookie 来增强们网站上的体验。',
    duration: 0,
    close: false,
    actions: [{
      label: '同意',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
        toast.remove(consentToastId) // 通过 id 移除
      }
    }, {
      label: '拒绝',
      color: 'neutral',
      variant: 'ghost',
      onClick: () => {
        toast.remove(consentToastId) // 通过 id 移除
      }
    }]
  })
})
</script>

<template>
  <!-- 确保根节点一致性，避免服务端/客户端渲染差异 -->
  <div class="dashboard-container">
    <UDashboardGroup unit="rem">
      <UDashboardSidebar
        id="default"
        v-model:open="open"
        collapsible
        resizable
        class="bg-elevated/25"
        :ui="{ footer: 'lg:border-t lg:border-default' }"
      >
        <template #default="{ collapsed }">
          <UDashboardSearchButton
            :collapsed="collapsed"
            class="bg-transparent ring-default"
          />

          <!-- 导航菜单：确保 orientation 和 collapsed 传递正确 -->
          <UNavigationMenu
            :collapsed="collapsed"
            :items="links"
            orientation="vertical"
            tooltip
            popover
          />
        </template>
        <template #footer="{ collapsed }">
          <UserMenu :collapsed="collapsed" />
        </template>
      </UDashboardSidebar>

      <UDashboardSearch :groups="groups" :color-mode="false" />

      <slot />
    </UDashboardGroup>
  </div>
</template>
