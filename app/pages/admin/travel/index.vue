<script setup lang="ts">
import { ref, computed, onMounted, h, resolveComponent } from 'vue'
import type { TableColumn, TableRow, ContextMenuItem } from '@nuxt/ui'
import { useClipboard } from '@vueuse/core'

const { t } = useI18n()
const localePath = useLocalePath()

definePageMeta({
  layout: 'default',
  middleware: 'sidebase-auth'
})

// --- 1. Component Resolution (Required for h() render function) ---
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UCheckbox = resolveComponent('UCheckbox')
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
    } catch (e) { /* ignore parse errors while typing */ }
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
        toast.add({ title: t('admin.tra.copied'), color: 'green' })
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
        toast.add({ title: t('admin.tra.copied'), color: 'green' })
      }
    }
  ]
}

function onContextmenu(_e: MouseEvent, row: TableRow<TravelCity>) {
  contextMenuItems.value = getRowItems(row)
}

// --- 6. Data Loading ---
async function loadData() {
  loading.value = true
  try {
    const response: any = await $fetch('/api/travel/records')
    if (response.success && response.data) {
      tableData.value = Array.isArray(response.data) ? response.data : []
      jsonText.value = JSON.stringify(tableData.value, null, 2)
      visible.value = response.visible !== false
    }
  } catch (error: any) {
    toast.add({ title: t('admin.tra.loadFailed'), description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function saveData() {
  if (!jsonData.value.trim()) {
    toast.add({ title: t('admin.tra.inputError'), description: t('admin.tra.enterJson'), color: 'red' }); return
  }
  let parsedData
  try {
    parsedData = JSON.parse(jsonData.value)
    if (!Array.isArray(parsedData)) throw new Error(t('admin.tra.mustBeArray'))
  } catch (e: any) {
    toast.add({ title: t('admin.tra.formatFailed'), description: e.message, color: 'red' }); return
  }

  saving.value = true
  try {
    await $fetch('/api/travel/records', {
      method: 'POST',
      body: { data: jsonData.value, visible: visible.value }
    })
    tableData.value = parsedData
    toast.add({ title: t('admin.tra.saveSuccess'), color: 'green' })
  } catch (error: any) {
    toast.add({ title: t('admin.tra.saveFailed'), description: error.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse(jsonData.value)
    jsonText.value = JSON.stringify(parsed, null, 2)
    tableData.value = Array.isArray(parsed) ? parsed : tableData.value
    toast.add({ title: t('admin.tra.formatSuccess'), color: 'green' })
  } catch (e) {
    toast.add({ title: t('admin.tra.formatFailed'), color: 'red' })
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
  <div class="h-full w-full overflow-y-auto">
    <div class="container mx-auto px-4 py-6 max-w-5xl">
      <UPageCard
        :title="t('admin.tra.management')"
        :description="t('admin.tra.managementDesc')"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          icon="i-lucide-refresh-cw"
          variant="ghost"
          :loading="loading"
          class="w-fit lg:ms-auto"
          @click="loadData"
        >
          {{ t('admin.tra.refresh') }}
        </UButton>
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500">{{ t('admin.tra.showOnHome') }}</label>
          <USwitch v-model="visible" />
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <div class="space-y-6">
          <div class="w-full">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold">
                {{ t('admin.tra.preview') }} ({{ tableData.length }} {{ t('admin.tra.records') }})
              </h3>
              <UButton icon="i-lucide-plus" size="sm" @click="addRecord">
                {{ t('admin.tra.add') }}
              </UButton>
            </div>

            <UContextMenu :items="contextMenuItems">
              <UTable
                v-model:row-selection="rowSelection"
                :data="tableData"
                :columns="columns"
                :loading="loading"
                class="border border-gray-200 dark:border-gray-700 rounded-lg mb-6"
                @contextmenu="onContextmenu"
              >
                <template #empty-state>
                  <div class="flex flex-col items-center justify-center py-6 gap-3">
                    <span class="italic text-sm">{{ t('admin.tra.empty') }}</span>
                    <UButton icon="i-lucide-plus" size="sm" @click="addRecord">
                      {{ t('admin.tra.add') }}
                    </UButton>
                  </div>
                </template>
              </UTable>
            </UContextMenu>

            <div v-if="Object.keys(rowSelection).length > 0" class="text-xs text-gray-500 mb-4">
              {{ t('admin.tra.selected') }} {{ Object.keys(rowSelection).length }} {{ t('admin.tra.rows') }}
            </div>
          </div>

          <div class="w-full">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-semibold">{{ t('admin.tra.jsonData') }}</label>
              <div class="flex gap-2">
                <UButton size="xs" variant="ghost" @click="formatJson">
                  {{ t('admin.tra.format') }}
                </UButton>
                <UButton size="xs" variant="ghost" @click="resetToExample">
                  {{ t('admin.tra.example') }}
                </UButton>
              </div>
            </div>

            <UTextarea
              v-model="jsonData"
              :rows="20"
              placeholder="[{&quot;name&quot;: &quot;北京&quot;...}]"
              class="font-mono text-sm w-full"
              :ui="{ wrapper: 'w-full', base: 'w-full resize-none' }"
            />
          </div>

          <USeparator />

          <div class="flex justify-end gap-3 pt-2">
            <UButton variant="outline" @click="loadData">
              {{ t('admin.tra.cancel') }}
            </UButton>
            <UButton color="primary" :loading="saving" @click="saveData">
              {{ t('admin.tra.save') }}
            </UButton>
          </div>
        </div>
      </UPageCard>
    </div>
  </div>
</template>

<style scoped>
pre code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
