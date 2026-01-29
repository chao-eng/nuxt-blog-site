<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

// 侧边栏展开状态（初始值确保服务端/客户端一致）
const open = ref(false)

const { t } = useI18n()
const localePath = useLocalePath()

const links = computed<NavigationMenuItem[]>(() => [
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
    },
    {
      label: t('admin.s3'),
      to: localePath('/admin/settings/s3'),
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
      },
      {
        id: 's3-settings',
        label: t('admin.s3'),
        icon: 'i-lucide-image',
        to: localePath('/admin/settings/s3')
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
        class="admin-sidebar"
        :ui="{ 
          footer: 'lg:border-t lg:border-gray-200/50 dark:lg:border-gray-800/50' 
        }"
      >
        <template #header="{ collapsed }">
          <div class="flex items-center gap-3 px-1 py-2 overflow-hidden group">
            <div class="brand-logo shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-shadow">
              <UIcon name="i-lucide-zap" class="w-5 h-5 text-white" />
            </div>
            <div class="flex flex-col min-w-0 transition-opacity duration-300" :class="{ 'opacity-0': collapsed }">
              <span class="text-sm font-black tracking-widest text-gray-900 dark:text-white uppercase leading-none">
                {{ $t('admin.adminSystemTitle') }}
              </span>
              <span class="text-[9px] font-bold text-primary-500 uppercase tracking-tighter mt-1 opacity-80">
                {{ $t('admin.adminConsole') }}
              </span>
            </div>
          </div>
        </template>

        <template #default="{ collapsed }">
          <UDashboardSearchButton
            :collapsed="collapsed"
            class="sidebar-search-btn mb-4 mx-1"
          />

          <!-- 导航菜单 -->
          <UNavigationMenu
            :collapsed="collapsed"
            :items="links"
            orientation="vertical"
            tooltip
            popover
            class="admin-nav-menu"
          />
        </template>
        
        <template #footer="{ collapsed }">
          <div class="footer-glass py-2 px-1">
            <UserMenu :collapsed="collapsed" />
          </div>
        </template>
      </UDashboardSidebar>

      <UDashboardSearch :groups="groups" :color-mode="false" />

      <slot />
    </UDashboardGroup>
  </div>
</template>

<style scoped>
.dashboard-container {
  background: radial-gradient(circle at top left, rgba(99, 102, 241, 0.03) 0%, transparent 40%),
              radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.03) 0%, transparent 40%);
  min-height: 100vh;
}

/* 侧边栏玻璃态 */
.admin-sidebar {
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(15px);
  border-right: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.dark .admin-sidebar {
  background: rgba(10, 10, 15, 0.6) !important;
  border-right-color: rgba(255, 255, 255, 0.05) !important;
}

/* 品牌 Logo */
.brand-logo {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.brand-logo::after {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border-radius: 0.85rem;
  z-index: -1;
  opacity: 0.3;
  filter: blur(4px);
}

/* 搜索按钮美化 */
.sidebar-search-btn {
  background: rgba(0, 0, 0, 0.03) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  border-radius: 0.75rem !important;
  transition: all 0.3s ease !important;
}

.dark .sidebar-search-btn {
  background: rgba(255, 255, 255, 0.03) !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
}

.sidebar-search-btn:hover {
  background: white !important;
  border-color: #6366f1 !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1) !important;
}

.dark .sidebar-search-btn:hover {
  background: rgba(30, 41, 59, 0.6) !important;
}

/* 垂直导航菜单美化 */
:deep(.admin-nav-menu) {
  --nav-item-active-bg: linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent);
}

:deep(.admin-nav-menu [role="menuitem"]) {
  border-radius: 0.75rem !important;
  margin-bottom: 0.25rem !important;
  font-weight: 600 !important;
  padding: 0.6rem 0.75rem !important;
  transition: all 0.2s ease !important;
}

:deep(.admin-nav-menu [aria-current="page"]),
:deep(.admin-nav-menu .router-link-active) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
}

:deep(.admin-nav-menu [aria-current="page"] .lucide),
:deep(.admin-nav-menu .router-link-active .lucide) {
  color: white !important;
}

.footer-glass {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 1rem;
  margin: 0.5rem;
}

.dark .footer-glass {
  background: rgba(255, 255, 255, 0.02);
}
</style>
