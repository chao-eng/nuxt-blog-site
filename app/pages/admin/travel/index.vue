<script setup lang="ts">
import { ref, computed, onMounted, h, resolveComponent } from 'vue'
import type { TableColumn, TableRow, ContextMenuItem } from '@nuxt/ui'
import type { Result } from '~/types'
import { useClipboard } from '@vueuse/core'

const { t } = useI18n()
const localePath = useLocalePath()

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

// --- 1. Component Resolution (Required for h() render function) ---
const UButton = resolveComponent('UButton')
// Simple html tags like 'img' or 'div' don't need resolution

// --- 2. Types & State ---
interface TravelCity {
  name: string
  value: [number, number]
  time: string
  description: string
  photos?: string[]
  articleLink?: string
}

const visible = ref(true)
const loading = ref(false)
const saving = ref(false)
const toast = useToast()
const { copy } = useClipboard()

const tableData = ref<TravelCity[]>([])
const rowSelection = ref<Record<string, boolean>>({}) // For Checkboxes
const jsonText = ref('')

// Computed JSON logic (Keep existing logic)
const jsonData = computed({
  get: () => jsonText.value || JSON.stringify(tableData.value, null, 2),
  set: (value: string) => {
    jsonText.value = value
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) tableData.value = parsed
    } catch { /* ignore parse errors while typing */ }
  }
})

// --- 3. Actions ---
function editRecord(index: number) {
  navigateTo(localePath(`/admin/travel/edit?index=${index}`))
}

function addRecord() {
  navigateTo(localePath('/admin/travel/edit'))
}

// --- 4. Programmatic Column Definitions ---
const columns: TableColumn<TravelCity>[] = [
  // Name Column
  {
    accessorKey: 'name',
    header: () => t('admin.tra.location'),
    cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
      h('span', { class: 'font-medium text-gray-900 dark:text-white' }, row.getValue('name'))
    ])
  },
  // Time Column
  {
    accessorKey: 'time',
    header: () => t('admin.tra.time'),
    cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
      h('span', { class: 'font-medium text-gray-900 dark:text-white' }, row.getValue('time'))
    ])
  },
  // Description Column
  {
    accessorKey: 'description',
    header: () => t('admin.tra.description'),
    cell: ({ row }) => h('span', {
      class: 'font-medium text-gray-900 dark:text-white max-w-[240px]',
      title: row.getValue('description')
    }, row.getValue('description') || '-')
  },
  // Photos Column
  {
    accessorKey: 'photos',
    header: () => t('admin.tra.photos'),
    cell: ({ row }) => {
      const photos = row.getValue('photos') as string[] | undefined
      if (!photos || photos.length === 0) {
        return h('span', { class: 'text-gray-400 text-xs' }, '-')
      }

      const imgElements = photos.slice(0, 3).map(src =>
        h('img', {
          src,
          class: 'w-8 h-8 object-cover rounded-lg border border-gray-200 dark:border-gray-700 ring-1 ring-white dark:ring-gray-900 transition-transform hover:scale-110 hover:z-10'
        })
      )

      if (photos.length > 3) {
        imgElements.push(h('div', {
          class: 'flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 font-medium ring-1 ring-white dark:ring-gray-900'
        }, `+${photos.length - 3}`))
      }

      return h('div', { class: 'flex -space-x-3 hover:space-x-1 transition-all duration-300 pl-2' }, imgElements)
    }
  },
  // Article Link Column
  {
    accessorKey: 'articleLink',
    header: () => t('admin.tra.relatedArticle'),
    cell: ({ row }) => {
      const link = row.getValue('articleLink') as string
      if (!link) return h('span', { class: 'text-gray-400 text-xs' }, '-')

      return h(UButton, {
        size: 'xs',
        color: 'primary',
        variant: 'ghost',
        to: link,
        target: '_blank',
        onClick: (e: Event) => e.stopPropagation()
      }, () => t('admin.tra.view'))
    }
  },
  // Actions Column
  {
    id: 'actions',
    header: () => t('admin.tra.actions'),
    cell: ({ row }) => {
      return h(UButton, {
        size: 'xs',
        color: 'primary',
        variant: 'soft',
        onClick: (e: Event) => {
          e.stopPropagation()
          const index = tableData.value.indexOf(row.original)
          editRecord(index)
        }
      }, () => t('admin.tra.edit'))
    }
  }
]

// --- 5. Context Menu Logic ---
const contextMenuItems = ref<ContextMenuItem[]>([])

function getRowItems(row: TableRow<TravelCity>) {
  return [
    {
      type: 'label' as const,
      label: t('admin.tra.actions')
    },
    {
      label: t('admin.tra.copyName'),
      icon: 'i-lucide-copy',
      onSelect() {
        copy(row.original.name)
        toast.add({ title: t('admin.tra.copied'), color: 'success' })
      }
    },
    {
      label: t('admin.tra.edit'),
      icon: 'i-lucide-pencil',
      onSelect() {
        const index = tableData.value.indexOf(row.original)
        editRecord(index)
      }
    },
    { type: 'separator' as const },
    {
      label: t('admin.tra.copyJson'),
      icon: 'i-lucide-code',
      onSelect() {
        copy(JSON.stringify(row.original, null, 2))
        toast.add({ title: t('admin.tra.copied'), color: 'success' })
      }
    }
  ]
}

function onContextmenu(_e: Event, row: TableRow<TravelCity>) {
  contextMenuItems.value = getRowItems(row)
}

// --- 6. Data Loading ---
async function loadData() {
  loading.value = true
  try {
    const response = await $fetch<Result<TravelCity[]> & { visible?: boolean }>('/api/travel/records')
    if (response.success && response.data) {
      tableData.value = Array.isArray(response.data) ? response.data : []
      jsonText.value = JSON.stringify(tableData.value, null, 2)
      visible.value = response.visible !== false
    }
  } catch (error: unknown) {
    toast.add({ title: t('admin.tra.loadFailed'), description: (error as Error).message, color: 'error' })
  } finally {
    loading.value = false
  }
}

async function saveData() {
  if (!jsonData.value.trim()) {
    toast.add({ title: t('admin.tra.inputError'), description: t('admin.tra.enterJson'), color: 'error' })
    return
  }
  let parsedData
  try {
    parsedData = JSON.parse(jsonData.value)
    if (!Array.isArray(parsedData)) throw new Error(t('admin.tra.mustBeArray'))
  } catch (e: unknown) {
    toast.add({ title: t('admin.tra.formatFailed'), description: (e as Error).message, color: 'error' })
    return
  }

  saving.value = true
  try {
    await $fetch('/api/travel/records', {
      method: 'POST',
      body: { data: jsonData.value, visible: visible.value }
    })
    tableData.value = parsedData
    toast.add({ title: t('admin.tra.saveSuccess'), color: 'success' })
  } catch (error: unknown) {
    toast.add({ title: t('admin.tra.saveFailed'), description: (error as Error).message, color: 'error' })
  } finally {
    saving.value = false
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse(jsonData.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
    tableData.value = Array.isArray(parsed) ? parsed : tableData.value
    toast.add({ title: t('admin.tra.formatSuccess'), color: 'success' })
  } catch {
    toast.add({ title: t('admin.tra.formatFailed'), color: 'error' })
  }
}

function resetToExample() {
  const exampleData: TravelCity[] = [
    { name: '北京', value: [116.4074, 39.9042], time: '2024年3月', description: '游览了故宫', photos: [], articleLink: '' }
  ]
  tableData.value = exampleData
  jsonText.value = JSON.stringify(exampleData, null, 2)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <UDashboardPanel grow class="travel-bg-gradient group/panel">
    <UDashboardNavbar class="navbar-modern">
      <template #leading>
        <div class="flex items-center gap-2">
           <UDashboardSidebarCollapse />
           <div class="flex items-center gap-2.5 ml-1">
             <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shadow-inner">
                <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-indigo-500" />
             </div>
             <span class="text-base font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
               {{ t('admin.tra.management') }}
             </span>
           </div>
        </div>
      </template>

      <template #right>
        <div class="flex items-center gap-1.5 px-2">
          <UTooltip :text="t('admin.tra.refresh')">
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              size="sm"
              :loading="loading"
              class="toolbar-btn rounded-xl"
              @click="loadData"
            />
          </UTooltip>
          <div class="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
          <UButton
            icon="i-lucide-plus"
            color="primary"
            variant="solid"
            size="sm"
            class="action-btn-glow rounded-xl px-3"
            @click="addRecord"
          >
            <span class="font-bold">{{ t('admin.tra.add') }}</span>
          </UButton>
        </div>
      </template>
    </UDashboardNavbar>

    <UDashboardToolbar class="px-6 py-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/40 dark:bg-black/20 backdrop-blur-md">
      <div class="flex items-center gap-6">
        <div class="flex flex-col">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{{ t('admin.tra.showOnHome') }}</span>
          <div class="flex items-center gap-2">
            <USwitch v-model="visible" color="primary" size="sm" />
            <span class="text-xs font-bold" :class="visible ? 'text-primary-500' : 'text-gray-500'">
              {{ visible ? t('nav.home') : t('admin.art.draft') }}
            </span>
          </div>
        </div>
        <div class="w-px h-8 bg-gray-200 dark:bg-gray-800" />
        <div class="flex flex-col">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{{ t('admin.tra.records') }}</span>
          <span class="text-lg font-black tracking-tighter text-indigo-500">
            {{ tableData.length }} 
            <small class="text-[10px] font-bold text-gray-400 ml-1">UNITS</small>
          </span>
        </div>
      </div>
    </UDashboardToolbar>

    <UDashboardPanelContent class="p-6 space-y-8 scroll-smooth overflow-y-auto">
      <!-- 表格预览区域 -->
      <section class="space-y-4">
        <div class="flex items-center gap-2 px-1">
          <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
          <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest">{{ t('admin.tra.preview') }}</h3>
        </div>

        <div class="travel-table-card overflow-hidden">
          <UContextMenu :items="contextMenuItems">
            <UTable
              v-model:row-selection="rowSelection"
              :data="tableData"
              :columns="columns"
              :loading="loading"
              class="travel-table"
            >
              <template #empty-state>
                <div class="flex flex-col items-center justify-center py-12 gap-4">
                  <div class="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700">
                    <UIcon name="i-lucide-map" class="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <span class="text-sm font-bold text-gray-400 tracking-wide">{{ t('admin.tra.empty') }}</span>
                  <UButton icon="i-lucide-plus" size="sm" class="action-btn-glow" @click="addRecord">
                    {{ t('admin.tra.add') }}
                  </UButton>
                </div>
              </template>
            </UTable>
          </UContextMenu>
        </div>
      </section>

      <!-- JSON 数据区域 -->
      <section class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
            <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest">{{ t('admin.tra.jsonData') }}</h3>
          </div>
          <div class="flex gap-2">
            <UButton size="xs" variant="soft" color="neutral" class="rounded-lg font-bold" @click="formatJson">
              {{ t('admin.tra.format') }}
            </UButton>
            <UButton size="xs" variant="ghost" color="neutral" class="rounded-lg font-bold" @click="resetToExample">
              {{ t('admin.tra.example') }}
            </UButton>
          </div>
        </div>

        <div class="json-editor-container group">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
          <UTextarea
            v-model="jsonData"
            :rows="15"
            placeholder="[{&quot;name&quot;: &quot;北京&quot;...}]"
            autoresize
            class="json-textarea"
            :ui="{ base: 'font-mono text-sm leading-relaxed tracking-tight' }"
          />
        </div>
      </section>

      <div class="flex justify-end gap-3 pt-4 pb-12">
        <UButton 
          variant="ghost" 
          color="neutral" 
          class="h-11 px-6 rounded-xl font-bold uppercase tracking-widest transition-all hover:bg-gray-100 dark:hover:bg-white/5"
          @click="loadData"
        >
          {{ t('admin.tra.cancel') }}
        </UButton>
        <UButton 
          color="primary" 
          :loading="saving" 
          class="h-11 px-8 rounded-xl font-bold uppercase tracking-widest action-btn-glow"
          @click="saveData"
        >
          {{ t('admin.tra.save') }}
        </UButton>
      </div>
    </UDashboardPanelContent>
  </UDashboardPanel>
</template>

<style scoped>
.travel-bg-gradient {
  background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.03) 0%, transparent 40%),
              radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.03) 0%, transparent 40%);
}

.navbar-modern {
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.dark .navbar-modern {
  background: rgba(10, 10, 15, 0.4) !important;
  border-bottom-color: rgba(255, 255, 255, 0.05) !important;
}

.toolbar-btn {
  transition: all 0.3s ease;
  opacity: 0.7;
}

.toolbar-btn:hover {
  opacity: 1;
  background: rgba(99, 102, 241, 0.1) !important;
  transform: translateY(-1px);
}

.action-btn-glow {
  background: linear-gradient(135deg, #6366f1, #a855f7) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

.action-btn-glow:hover {
  transform: scale(1.02) translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.5) !important;
}

.travel-table-card {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
}

.dark .travel-table-card {
  background: rgba(15, 23, 42, 0.3);
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.travel-table-card:hover {
  border-color: rgba(99, 102, 241, 0.2);
  box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.1);
}

:deep(.travel-table) {
  --ui-table-border-color: rgba(0, 0, 0, 0.03);
}

.dark :deep(.travel-table) {
  --ui-table-border-color: rgba(255, 255, 255, 0.03);
}

:deep(.travel-table tr) {
  transition: background-color 0.2s ease;
}

:deep(.travel-table tr:hover) {
  background-color: rgba(99, 102, 241, 0.02) !important;
}

.dark :deep(.travel-table tr:hover) {
  background-color: rgba(255, 255, 255, 0.01) !important;
}

.json-editor-container {
  position: relative;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1.25rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.dark .json-editor-container {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.05);
}

.json-editor-container:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.json-textarea :deep(textarea) {
  background: transparent !important;
  color: #1e293b !important;
  padding: 1.25rem !important;
  border: none !important;
  box-shadow: none !important;
}

.dark .json-textarea :deep(textarea) {
  color: #e2e8f0 !important;
}

/* 自定义滚动条 */
.json-textarea :deep(textarea)::-webkit-scrollbar {
  width: 6px;
}
.json-textarea :deep(textarea)::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.2);
  border-radius: 10px;
}
</style>
