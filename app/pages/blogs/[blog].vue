<script lang="ts" setup>
import type { Result } from '../../types'
import { format } from 'date-fns'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // 代码高亮样式（可选择其他主题）
import 'github-markdown-css/github-markdown-light.css'
import Giscus from '@giscus/vue'
import { onMounted } from 'vue'

interface TocItem {
  id: string
  text: string
  level: number
  element: HTMLElement
}

interface PageAnchor {
  id?: string
  label: string
  to?: string
  icon?: string
  depth?: number
}

definePageMeta({
  middleware: (to) => {
    if (to.query.layout === 'false') {
      setPageLayout(false)
    } else {
      setPageLayout('blog')
    }
  }
})

// 服务端数据获取
const { path } = useRoute()
const decodedPath = decodeURIComponent(path)
const blogPath = decodedPath.replace(/^(\/[a-z]{2})?\/blogs\//, '')
const { t, locale } = useI18n()

// 使用 useAsyncData 在服务端获取数据
const { data: articleData, error } = await useAsyncData(
  `blog-content-${blogPath}`,
  async () => {
    const res: Result<{
      content: string
      frontMatter: {
        title: string
        date: string
        description: string | null
        image: string | null
        tags: string[]
        published: boolean
        isSticky: boolean
      }
      author: {
        author: string
        avatar: string
      }
      adjacent: {
        prev: { title: string, path: string } | null
        next: { title: string, path: string } | null
      }
    }> = await $fetch('/api/blogs/content', {
      method: 'POST',
      body: { path: blogPath }
    })

    if (!res.success) {
      throw new Error(res.err || t('blog.fetchContentFailed'))
    }

    // 图片字符串替换
    const prefix = '/api/article/fetch?path=' + encodeURIComponent(blogPath + '/')
    const content = res?.data?.content ?? ''

    return {
      path: blogPath,
      title: res?.data?.frontMatter?.title ?? '',
      date: res?.data?.frontMatter?.date ?? '',
      description: res?.data?.frontMatter?.description ?? null,
      image: res?.data?.frontMatter?.image ?? null,
      tags: res?.data?.frontMatter?.tags ?? [],
      content: content.replace(
        /!\[(.*?)\]\(\1\)/g, // 匹配 ![xxx](xxx) 格式（[]和()内容相同）
        `![$1](${prefix}$1)` // 替换为 ![xxx](前缀/xxx)
      ),
      published: res?.data?.frontMatter?.published ?? false,
      author: res?.data?.author?.author || '',
      avatar: res?.data?.author?.avatar || '',
      adjacent: res?.data?.adjacent || { prev: null, next: null }
    }
  }
)

// 错误处理
if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: t('blog.articleNotFound')
  })
}

const article = articleData.value!

// 客户端逻辑
const tocItems = ref<TocItem[]>([])
const anchors = computed<PageAnchor[]>(() =>
  tocItems.value.map(item => ({
    id: item.id,
    label: item.text,
    to: `#${item.id}`,
    depth: item.level - 1
  }))
)

// 生成安全的 ID
const generateSafeId = (text: string, index: number): string => {
  const cleanText = text
    .replace(/[^\w\u4e00-\u9fa5-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  const baseId = cleanText || 'heading'
  return `${baseId}-${index}`
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  try {
    return format(new Date(dateString), 'yyyy年MM月dd日')
  } catch {
    return dateString
  }
}

const localePath = useLocalePath()

// 标签跳转函数
const navigateToTag = (tag: string): void => {
  navigateTo(localePath(`/tags/${encodeURIComponent(tag)}`))
}

// 生成目录的函数
const generateTOC = (): void => {
  const previewContainer = document.getElementById('preview-container')
  if (!previewContainer) return

  const headings = previewContainer.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const toc: TocItem[] = []

  headings.forEach((heading, index) => {
    const text = heading.textContent?.trim() || ''
    if (!text) return

    const level = parseInt(heading.tagName.substring(1))
    const safeId = generateSafeId(text, index)

    heading.id = safeId
    ;(heading as HTMLElement).style.scrollMarginTop = 'calc(var(--navbar-height, 64px) + 1rem)'

    toc.push({
      id: safeId,
      text,
      level,
      element: heading as HTMLElement
    })
  })

  tocItems.value = toc
}

// 检测并设置导航栏高度
const detectNavbarHeight = () => {
  const navSelectors = [
    'nav',
    '.navbar',
    '.header',
    '[data-navbar]',
    'header[class*="nav"]',
    '.navigation',
    '#navbar',
    '#header'
  ]

  let navbar: HTMLElement | null = null
  for (const selector of navSelectors) {
    navbar = document.querySelector(selector)
    if (navbar) break
  }

  const height = navbar ? navbar.offsetHeight : 64
  document.documentElement.style.setProperty('--navbar-height', `${height}px`)
}

// 初始化 markdown-it，配置代码高亮
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (err) {
        console.error('代码高亮失败:', err)
      }
    }
    return '' // 使用默认转义
  }
})

// 直接渲染 markdown（在 setup 中执行，服务端和客户端都会运行）
const renderedHtml = computed(() => {
  if (article.content) {
    return md.render(article.content)
  }
  return ''
})

// 客户端初始化
onMounted(() => {
  detectNavbarHeight()
  window.addEventListener('resize', detectNavbarHeight)

  // 等待 DOM 渲染完成后生成目录
  nextTick(() => {
    generateTOC()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', detectNavbarHeight)
})

// SEO优化
useHead({
  title: article.title,
  meta: [
    {
      name: 'description',
      content: article.description || article.title
    },
    {
      property: 'og:title',
      content: article.title
    },
    {
      property: 'og:description',
      content: article.description || article.title
    },
    {
      property: 'og:image',
      content: article.image
    }
  ]
})

const colorMode = useColorMode()
// 移除旧的配置获取方式
// const giscusData = useGiscusData()

// 评论配置状态
const commentConfig = ref({
  enableComments: false,
  repo: '',
  repoId: '',
  category: '',
  categoryId: ''
})

// 获取评论配置
const { data: configData } = await useAsyncData('comment-config', () => $fetch('/api/comments/config'))
if (configData.value && configData.value.success) {
  commentConfig.value = configData.value.data
}

const giscusConfig = computed(() => ({
  theme: colorMode.value === 'dark' ? 'gruvbox_dark' : 'noborder_light',
  term: 'blogs/' + article.path,
  repo: commentConfig.value.repo,
  repoId: commentConfig.value.repoId,
  category: commentConfig.value.category,
  categoryId: commentConfig.value.categoryId
}))

// 新消息通知
const { $router } = useNuxtApp()
const commentState = reactive({
  current: 0,
  initial: null,
  isReady: false
})

function handleGiscusMessage(event: MessageEvent) {
  if (event.origin !== 'https://giscus.app') return
  if (!event.data?.giscus) return

  const giscusData = event.data.giscus
  if ('discussion' in giscusData) {
    const count = giscusData.discussion.totalCommentCount
    if (commentState.initial === null) {
      commentState.initial = count
      commentState.current = count
      commentState.isReady = true
      // console.log('🎯 页面评论基准设定:', count);
      return
    }
    if (count > commentState.current && commentState.isReady) {
      const newCount = count - commentState.current
      showRealTimeNotification(t('blog.newCommentsNotification', { title: article.title, count: newCount }))
    }
    commentState.current = count
  }
}

function showRealTimeNotification(message: string) {
  console.log('🔔', message)
}

onMounted(() => {
  if (commentConfig.value.enableComments) {
    window.addEventListener('message', handleGiscusMessage)
  }
})

onUnmounted(() => {
  window.removeEventListener('message', handleGiscusMessage)
})

watch(() => $router.currentRoute.value.path, () => {
  commentState.initial = null
  commentState.isReady = false
})
</script>

<template>
  <div class="article-page">
    <div class="page-content ">
      <!-- 主要文章内容区域 -->
      <main class="article-content">
        <UContainer class="py-8">
          <div class="bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30 dark:bg-none article-container max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <!-- 文章头部信息 -->
            <header class="px-6 lg:px-8 py-8 border-b border-gray-200 dark:border-gray-700">
              <!-- 标题 -->
              <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                {{ article.title }}
              </h1>

              <!-- 作者信息和元数据 -->
              <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div class="flex items-center gap-4">
                  <!-- 作者头像和信息 -->
                  <div class="flex items-center gap-3">
                    <UAvatar
                      :src="article.avatar"
                      :alt="$t('blog.avatar')"
                      size="md"
                    />
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ article.author }}
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ formatDate(article.date) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 文章摘要 -->
              <div v-if="article.description" class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 mb-6 border-l-4 border-primary-500">
                <p class="text-lg text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                  {{ article.description }}
                </p>
              </div>

              <!-- 标签 -->
              <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-3">
                <UBadge
                  v-for="(tag) in article.tags"
                  :key="tag"
                  variant="solid"
                  size="md"
                  class="hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  @click="navigateToTag(tag)"
                >
                  # {{ tag }}
                </UBadge>
              </div>
            </header>

            <!-- 文章封面图 -->
            <div v-if="article.image" class="px-6 lg:px-8 py-6 border-b border-gray-100 dark:border-gray-700">
              <img
                :src="article.image"
                :alt="article.title"
                class="w-full max-h-96 object-cover rounded-xl shadow-md border border-gray-200 dark:border-gray-600"
              >
            </div>

            <!-- 文章正文 -->
            <article class="px-6 lg:px-8 py-8">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                id="preview-container"
                class="markdown-body prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700"
                v-html="renderedHtml"
              />
            </article>

            <!-- 文章底部 -->
            <footer class="px-6 lg:px-8 py-8 border-t border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              <!-- 标签重复展示 -->
              <div v-if="article.tags && article.tags.length > 0" class="mb-8">
                <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-2">
                  <span class="i-lucide-tag w-4 h-4" />
                  {{ $t('blog.relatedTags') }}
                </h4>
                <div class="flex flex-wrap gap-2">
                  <UBadge
                    v-for="tag in article.tags"
                    :key="`footer-${tag}`"
                    variant="outline"
                    size="md"
                    class="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer border-2 hover:scale-105"
                    @click="navigateToTag(tag)"
                  >
                    {{ tag }}
                  </UBadge>
                </div>
              </div>

              <!-- 互动区域 -->
              <div class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-4" />

                <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span class="i-lucide-clock w-4 h-4" />
                  <span>{{ $t('blog.readTime', { time: Math.ceil(article.content.length / 500) }) }}</span>
                </div>
              </div>

              <!-- 上一篇/下一篇导航 -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8 border-t border-gray-200 dark:border-gray-700 mt-6">
                <!-- 上一篇 -->
                <NuxtLink
                  v-if="article.adjacent?.prev"
                  :to="`/blogs/${article.adjacent.prev.path}`"
                  class="group flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <div class="flex-1 min-w-0 text-left">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('blog.prevArticle') }}</div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {{ article.adjacent.prev.title }}
                    </div>
                  </div>
                </NuxtLink>
                <div v-else class="hidden sm:block" /> <!-- 占位符 -->

                <!-- 下一篇 -->
                <NuxtLink
                  v-if="article.adjacent?.next"
                  :to="`/blogs/${article.adjacent.next.path}`"
                  class="group flex items-center justify-end gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <div class="flex-1 min-w-0 text-right">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ $t('blog.nextArticle') }}</div>
                    <div class="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {{ article.adjacent.next.title }}
                    </div>
                  </div>
                  <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </NuxtLink>
              </div>

              <Giscus
                v-if="commentConfig.enableComments"
                id="comments"
                :repo="giscusConfig.repo as `${string}/${string}`"
                :repo-id="giscusConfig.repoId"
                :category="giscusConfig.category"
                :category-id="giscusConfig.categoryId"
                mapping="specific"
                :term="giscusConfig.term"
                reactions-enabled="1"
                emit-metadata="1"
                input-position="top"
                :theme="giscusConfig.theme"
                :lang="locale"
                loading="lazy"
              />
            </footer>
          </div>
        </UContainer>
      </main>

      <!-- 右侧大纲区域 -->
      <ClientOnly>
        <aside class="toc-aside">
          <nav class="toc-nav" :aria-label="$t('blog.toc')">
            <div class="toc-container bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              <div class="p-4">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                  <span class="i-lucide-list w-4 h-4" />
                  {{ $t('blog.toc') }}
                </h4>

                <!-- 使用 UPageAnchors 组件 -->
                <div class="toc-content">
                  <div v-if="anchors.length > 0">
                    <UPageAnchors :links="anchors" />
                  </div>

                  <!-- 目录为空时的提示 -->
                  <div v-else class="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
                    <div class="flex flex-col items-center gap-3">
                      <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span class="i-lucide-file-text w-6 h-6" />
                      </div>
                      <div>
                        <p class="font-medium">
                          {{ $t('blog.noToc') }}
                        </p>
                        <p class="text-xs mt-1 text-gray-400">
                          {{ $t('blog.tocGenerating') }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
/* CSS 自定义属性定义 */
.article-page {
  --content-max-width: 1024px;
  --toc-width: 288px;
  --layout-gap: 2rem;
  --navbar-height: 64px; /* 默认值，会被 JS 动态更新 */
  --layout-padding: 1rem;
}

/* 主要布局容器 */
.page-content {
  display: grid;
  grid-template-columns:
    minmax(var(--layout-padding), 1fr)
    min(var(--content-max-width), calc(100vw - var(--toc-width) - var(--layout-gap) - 2 * var(--layout-padding)))
    var(--toc-width)
    minmax(var(--layout-padding), 1fr);
  grid-template-areas: ". content toc .";
  gap: var(--layout-gap);
  min-height: calc(100vh - var(--navbar-height));
}

/* 文章内容区域 */
.article-content {
  grid-area: content;
  min-width: 0; /* 防止内容溢出 */
}

/* 大纲侧边栏 */
.toc-aside {
  grid-area: toc;
  width: var(--toc-width);
}

/* 大纲导航容器 */
.toc-nav {
  position: sticky;
  top: calc(var(--navbar-height) + 3rem);
  height: fit-content;
}

/* 大纲容器 */
.toc-container {
  max-height: calc(100vh - var(--navbar-height) - 2rem);
  overflow: hidden;
}

/* 大纲内容滚动区域 */
.toc-content {
  max-height: calc(100vh - var(--navbar-height) - 8rem);
  overflow-y: auto;
}

/* 响应式：大屏幕优化 */
@media (min-width: 1536px) {
  .article-page {
    --layout-gap: 3rem;
    --layout-padding: 2rem;
  }
}

/* 响应式：中大屏幕 */
@media (max-width: 1399px) and (min-width: 1280px) {
  .page-content {
    grid-template-columns:
      minmax(var(--layout-padding), 1fr)
      calc(100vw - var(--toc-width) - var(--layout-gap) - 2 * var(--layout-padding))
      var(--toc-width)
      minmax(var(--layout-padding), 1fr);
  }
}

/* 响应式：小屏幕时隐藏大纲 */
@media (max-width: 1279px) {
  .page-content {
    grid-template-columns:
      minmax(var(--layout-padding), 1fr)
      min(var(--content-max-width), calc(100vw - 2 * var(--layout-padding)))
      minmax(var(--layout-padding), 1fr);
    grid-template-areas: ". content .";
  }

  .toc-aside {
    display: none;
  }
}

/* 文章内容样式 */
#preview-container {
  color: #374151;
  line-height: 1.75;
}

.dark #preview-container {
  color: #d1d5db;
}

#preview-container h1,
#preview-container h2,
#preview-container h3,
#preview-container h4,
#preview-container h5,
#preview-container h6 {
  color: #111827;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #f3f4f6;
  scroll-margin-top: calc(var(--navbar-height) + 1rem);
}

.dark #preview-container h1,
.dark #preview-container h2,
.dark #preview-container h3,
.dark #preview-container h4,
.dark #preview-container h5,
.dark #preview-container h6 {
  color: #f9fafb;
  border-bottom-color: #374151;
}

/* 代码块样式 */
#preview-container code {
  background-color: #f3f4f6;
  color: #dc2626;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
}

.dark #preview-container code {
  background-color: #1f2937;
  color: #f87171;
  border-color: #374151;
}

#preview-container pre {
  background-color: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark #preview-container pre {
  background-color: #111827;
  border-color: #374151;
}

/* 引用块样式 */
#preview-container blockquote {
  border-left: 4px solid #3b82f6;
  background-color: #f8fafc;
  padding: 1.25rem;
  margin: 1.5rem 0;
  font-style: italic;
  border-radius: 0 0.5rem 0.5rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark #preview-container blockquote {
  background-color: #0f172a;
}

/* 段落样式 */
#preview-container p {
  margin-bottom: 1.25rem;
  line-height: 1.75;
}

/* 链接样式 - 增强版，使用 !important 覆盖 Vditor 和 Tailwind prose 默认样式 */
.prose a,
.prose :where(a):not(:where([class~="not-prose"] *)),
#preview-container a,
#preview-container p a,
#preview-container li a,
#preview-container td a,
.vditor-reset a {
  color: #2563eb !important;
  text-decoration: underline !important;
  text-decoration-color: #93c5fd !important;
  text-decoration-thickness: 2px !important;
  text-underline-offset: 3px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
  position: relative;
}

.prose a:hover,
.prose :where(a):not(:where([class~="not-prose"] *)):hover,
#preview-container a:hover,
#preview-container p a:hover,
#preview-container li a:hover,
#preview-container td a:hover,
.vditor-reset a:hover {
  color: #1d4ed8 !important;
  text-decoration-color: #2563eb !important;
  text-decoration-thickness: 2px !important;
  background-color: #eff6ff !important;
  padding: 0 4px !important;
  border-radius: 4px !important;
}

.dark .prose a,
.dark .prose :where(a):not(:where([class~="not-prose"] *)),
.dark #preview-container a,
.dark #preview-container p a,
.dark #preview-container li a,
.dark #preview-container td a,
.dark .vditor-reset a {
  color: #60a5fa !important;
  text-decoration-color: #3b82f6 !important;
}

.dark .prose a:hover,
.dark .prose :where(a):not(:where([class~="not-prose"] *)):hover,
.dark #preview-container a:hover,
.dark #preview-container p a:hover,
.dark #preview-container li a:hover,
.dark #preview-container td a:hover,
.dark .vditor-reset a:hover {
  color: #93c5fd !important;
  text-decoration-color: #60a5fa !important;
  background-color: #1e3a8a !important;
}

/* 图片样式 */
#preview-container img {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dark #preview-container img {
  border-color: #374151;
}

/* 表格样式 */
#preview-container table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 1.5rem 0;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

#preview-container th,
#preview-container td {
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  padding: 0.875rem 1rem;
  text-align: left;
}

#preview-container th:last-child,
#preview-container td:last-child {
  border-right: none;
}

#preview-container tr:last-child td {
  border-bottom: none;
}

.dark #preview-container table {
  border-color: #374151;
}

.dark #preview-container th,
.dark #preview-container td {
  border-color: #374151;
}

#preview-container th {
  background-color: #f3f4f6;
  font-weight: 600;
}

.dark #preview-container th {
  background-color: #1f2937;
}

/* 列表样式 */
#preview-container ul,
#preview-container ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

#preview-container li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* 分割线样式 */
#preview-container hr {
  margin: 2rem 0;
  border: none;
  border-top: 2px solid #e5e7eb;
  border-radius: 1px;
}

.dark #preview-container hr {
  border-top-color: #374151;
}

/* UPageAnchors 自定义样式 - 掘金风格 */
:deep(.ui-page-anchors) {
  --ui-page-anchors-depth-padding: 0.75rem;
}

:deep(.ui-page-anchors a) {
  font-size: 0.8125rem;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  display: block;
  margin-bottom: 0.125rem;
  text-decoration: none;
  border-left: 3px solid transparent;
  position: relative;
  color: #64748b;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ui-page-anchors a:hover) {
  background-color: #f8fafc;
  border-left-color: #e2e8f0;
  color: #374151;
  transform: translateX(2px);
}

:deep(.dark .ui-page-anchors a) {
  color: #94a3b8;
}

:deep(.dark .ui-page-anchors a:hover) {
  background-color: #1e293b;
  border-left-color: #475569;
  color: #e2e8f0;
}

:deep(.ui-page-anchors a.router-link-active) {
  background-color: #eff6ff;
  color: #2563eb;
  border-left-color: #3b82f6;
  font-weight: 500;
  transform: translateX(2px);
}

:deep(.dark .ui-page-anchors a.router-link-active) {
  background-color: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
  border-left-color: #3b82f6;
}

/* 不同层级的样式 - 掘金风格 */
:deep(.ui-page-anchors a[style*="--depth: 0"]) {
  font-weight: 600;
  font-size: 0.875rem;
}

:deep(.ui-page-anchors a[style*="--depth: 1"]) {
  padding-left: 1.25rem;
  font-size: 0.8125rem;
  position: relative;
}

:deep(.ui-page-anchors a[style*="--depth: 1"]::before) {
  content: '';
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background-color: #cbd5e1;
  border-radius: 50%;
}

:deep(.ui-page-anchors a[style*="--depth: 2"]) {
  padding-left: 1.75rem;
  font-size: 0.8125rem;
  color: #9ca3af;
}

:deep(.ui-page-anchors a[style*="--depth: 3"]) {
  padding-left: 2.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

:deep(.ui-page-anchors a[style*="--depth: 4"]) {
  padding-left: 2.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

:deep(.ui-page-anchors a[style*="--depth: 5"]) {
  padding-left: 3.25rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* 目录滚动条样式 */
.toc-content {
  scrollbar-width: thin;
  scrollbar-color: #e5e7eb #f8fafc;
}

.toc-content::-webkit-scrollbar {
  width: 6px;
}

.toc-content::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 3px;
}

.toc-content::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 3px;
  transition: background 0.2s;
}

.toc-content::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

.dark .toc-content::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark .toc-content::-webkit-scrollbar-thumb {
  background: #475569;
}

.dark .toc-content::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>
