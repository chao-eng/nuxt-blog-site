<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const links = computed(() => [[{
  label: t('admin.set.account.title'),
  icon: 'i-lucide-user',
  to: localePath('/admin/settings'),
  exact: true
}, {
  label: t('admin.set.security.title'),
  icon: 'i-lucide-shield',
  to: localePath('/admin/settings/security')
}, {
  label: t('admin.set.comments.title'),
  icon: 'i-lucide-message-square',
  to: localePath('/admin/settings/comments')
}, {
  label: t('admin.set.umami.title'),
  icon: 'i-lucide-bar-chart',
  to: localePath('/admin/settings/umami')
}], [{
  label: t('admin.set.documentation'),
  icon: 'i-lucide-book-open',
  to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
  target: '_blank'
}]])
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar :title="t('admin.set.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
