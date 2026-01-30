<script lang="ts" setup>
import type { Result } from '~/types'
import { format } from 'date-fns'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'github-markdown-css/github-markdown.css'
import Giscus from '@giscus/vue'

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
        shortId: string
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
      published: (res?.data?.frontMatter?.published as any) ?? false,
      author: res?.data?.author?.author || '',
      avatar: res?.data?.author?.avatar || '',
      adjacent: res?.data?.adjacent || { prev: null, next: null },
      shortId: (res?.data?.frontMatter?.shortId as any) || ''
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

const article = computed(() => articleData.value!)

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
    return format(new Date(dateString), 'yyyy.MM.dd')
  } catch {
    return dateString
  }
}

const scrollPercent = ref(0)
const handleScroll = () => {
  const winScroll = document.documentElement.scrollTop
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
  scrollPercent.value = (winScroll / height) * 100
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
        const highlighted = hljs.highlight(str, { language: lang }).value
        // 直接在 pre 内部注入按钮，使用内联 SVG 确保图标显示，并且压缩为单行以避免 pre 标签保留多余空白
        return `<pre class="hljs code-block-container"><button class="copy-btn" title="Copy"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button><code>${highlighted}</code></pre>`
      } catch (err) {
        console.error('代码高亮失败:', err)
      }
    }
    return '' // 使用默认转义
  }
})

// 直接渲染 markdown（在 setup 中执行，服务端和客户端都会运行）
const renderedHtml = computed(() => {
  if (article.value.content) {
    return md.render(article.value.content)
  }
  return ''
})

// 客户端初始化
onMounted(() => {
  detectNavbarHeight()
  window.addEventListener('resize', detectNavbarHeight)
  window.addEventListener('scroll', handleScroll)

  // 复制功能逻辑
  const previewContainer = document.getElementById('preview-container')
  if (previewContainer) {
    previewContainer.addEventListener('click', async (e) => {
      const btn = (e.target as HTMLElement).closest('.copy-btn')
      if (!btn) return

      const pre = btn.closest('pre')
      const codeElement = pre?.querySelector('code')
      if (codeElement) {
        try {
          await navigator.clipboard.writeText(codeElement.textContent || '')
          
          // 成功反馈
          const originalHTML = btn.innerHTML
          // 切换为 Check 图标
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-green-500"><path d="M20 6 9 17l-5-5"/></svg>'
          setTimeout(() => {
            btn.innerHTML = originalHTML
          }, 2000)
        } catch (err) {
          console.error('Failed to copy:', err)
        }
      }
    })
  }

  // 等待 DOM 渲染完成后生成目录
  nextTick(() => {
    generateTOC()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', detectNavbarHeight)
  window.removeEventListener('scroll', handleScroll)
})

// SEO优化
useHead({
  title: article.value.title,
  meta: [
    {
      name: 'description',
      content: article.value.description || article.value.title
    },
    {
      property: 'og:title',
      content: article.value.title
    },
    {
      property: 'og:description',
      content: article.value.description || article.value.title
    },
    {
      property: 'og:image',
      content: article.value.image
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
  term: 'blogs/' + article.value.path,
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
      showRealTimeNotification(t('blog.newCommentsNotification', { title: article.value.title, count: newCount }))
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

const toast = useToast()
const copyShortLink = () => {
  const host = window.location.origin
  // 确保从 computed 属性中正确取值
  const currentArticle = article.value
  const shareUrl = currentArticle?.shortId 
    ? `${host}/s/${currentArticle.shortId}`
    : window.location.href
  
  navigator.clipboard.writeText(shareUrl).then(() => {
    toast.add({
      title: t('blog.shortLinkCopied'),
      description: shareUrl,
      color: 'primary',
      icon: 'i-lucide-check-circle'
    })
  }).catch(err => {
    console.error('Copy failed:', err)
    // 降级处理：手动模拟复制
    const textArea = document.createElement("textarea")
    textArea.value = shareUrl
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      toast.add({ title: t('blog.shortLinkCopied'), color: 'primary' })
    } catch (e) {
      toast.add({ title: '复制失败', color: 'error' })
    }
    document.body.removeChild(textArea)
  })
}
</script>

<template>
  <div class="article-page-premium animate-article-entrance">
    <!-- 全局背景装饰 -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary-500/5 blur-[120px] rounded-full animate-pulse" />
      <div class="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" style="animation-delay: 2s" />
    </div>

    <!-- 顶部全宽进度条 -->
    <div class="reading-progress-container">
      <div class="reading-progress-bar" :style="{ width: `${scrollPercent}%` }" />
    </div>

    <div class="page-content relative z-10">
      <!-- 主要文章内容区域 -->
      <main class="article-content">
        <UContainer class="py-8 lg:py-12">
          <!-- 文章卡片主体 - 极致玻璃态 -->
          <div class="article-glass-card shadow-2xl overflow-hidden">
            <!-- 文章头部：动态渐变设计 -->
            <header class="header-section p-6 lg:p-12 border-b border-gray-100 dark:border-gray-800/50">
              <!-- 标签展示 -->
              <div v-if="article.tags?.length" class="flex flex-wrap gap-2 mb-6">
                <span
                  v-for="tag in article.tags"
                  :key="tag"
                  class="premium-tag"
                  @click="navigateToTag(tag)"
                >
                  <UIcon name="i-lucide-hash" class="w-3 h-3 mr-1 opacity-50" />
                  {{ tag }}
                </span>
              </div>

              <!-- 标题：极简化大尺寸渐变 -->
              <h1 class="premium-title mb-8">
                {{ article.title }}
              </h1>

              <!-- 精简元数据卡片 -->
              <div class="meta-card-premium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4">
                <div class="flex items-center gap-5">
                  <!-- 头像区域（保留高级发光特效） -->
                  <div class="relative group/avatar">
                    <div class="absolute -inset-2 bg-gradient-to-tr from-primary-500/30 to-indigo-500/30 rounded-full blur-lg opacity-0 group-hover/avatar:opacity-100 transition-all duration-700" />
                    <UAvatar
                      :src="article.avatar"
                      :alt="article.author"
                      size="xl"
                      class="relative z-10 ring-4 ring-white/10 dark:ring-white/5 shadow-2xl"
                    />
                  </div>

                  <div class="flex flex-col">
                    <h2 class="text-lg lg:text-xl font-black text-gray-900 dark:text-white leading-none mb-2.5 tracking-tight">
                      {{ article.author }}
                    </h2>
                    <div class="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      <span class="flex items-center gap-2">
                        <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary-500/60" />
                        {{ formatDate(article.date) }}
                      </span>
                      <span class="hidden xs:block w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                      <span class="flex items-center gap-2">
                        <UIcon name="i-lucide-clock" class="w-4 h-4 text-indigo-500/60" />
                        {{ $t('blog.readTime', { time: Math.ceil((article.content?.length || 0) / 500) }) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 分享区：独立右置，更具仪式感 -->
                <div class="w-full sm:w-auto flex items-center justify-end border-t sm:border-t-0 border-gray-100 dark:border-white/5 pt-4 sm:pt-0">
                  <UTooltip :text="$t('blog.copyShortLink')" :shortcuts="['⌘', 'C']">
                    <button
                      class="premium-share-action group"
                      @click="copyShortLink"
                    >
                      <div class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 transition-all duration-300 group-hover:bg-primary-500/10 group-hover:border-primary-500/30 group-hover:translate-y-[-2px] group-active:translate-y-0 shadow-md group-hover:shadow-primary-500/20">
                        <UIcon name="i-lucide-share-2" class="w-4 h-4 text-primary-500 group-hover:rotate-12 transition-transform" />
                        <span class="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 group-hover:text-primary-500 transition-colors">SHARE</span>
                      </div>
                      <!-- 这种位置不再需要波纹，改用底座反馈 -->
                    </button>
                  </UTooltip>
                </div>
              </div>

              <!-- 文章摘要：引述风格 -->
              <div v-if="article.description" class="premium-abstract mt-8">
                <div class="abstract-accent" />
                <p class="text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium leading-[1.8]">
                  {{ article.description }}
                </p>
              </div>
            </header>

            <!-- 文章封面图：移动到标题和摘要下方 -->
            <div v-if="article.image" class="cover-image-container group px-6 lg:px-12 mt-8">
              <div class="cover-image-inner">
                <img
                  :src="article.image"
                  :alt="article.title"
                  class="cover-image w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>

            <!-- 文章正文区域 -->
            <article class="px-6 lg:px-12 py-12">
              <!-- eslint-disable vue/no-v-html -->
              <div
                id="preview-container"
                class="markdown-body premium-markdown-body"
                :data-color-mode="colorMode.value"
                v-html="renderedHtml"
              />
              <!-- eslint-enable vue/no-v-html -->
            </article>

            <!-- 文章底部：互动与导航 -->
            <footer class="footer-section px-6 lg:px-12 py-12 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/30 dark:bg-black/20">
              <!-- 结束语 -->
              <div class="flex flex-col items-center mb-12 text-center opacity-70">
                <div class="w-24 h-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent mb-6 transition-all hover:w-32" />
                <p class="text-[10px] font-black uppercase tracking-[0.4em] font-outfit text-gray-400">End of Article</p>
              </div>

              <!-- 底部分享区：更有仪式感的呼吁 -->
              <div class="flex flex-col items-center mb-16 px-4">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">{{ $t('blog.shareShortLink') || 'Share this Article' }}</p>
                <button
                  class="group relative flex items-center justify-center gap-4 px-12 py-4 rounded-3xl overflow-hidden transition-all duration-500 hover:scale-105 active:scale-95"
                  @click="copyShortLink"
                >
                  <!-- 动态玻璃背景 -->
                  <div class="absolute inset-0 bg-primary-500/5 dark:bg-white/5 backdrop-blur-md transition-colors group-hover:bg-primary-500/10" />
                  <div class="absolute inset-0 border border-primary-500/10 dark:border-white/10 transition-all duration-500 group-hover:border-primary-500/30 group-hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.2)]" />
                  
                  <UIcon name="i-lucide-share-2" class="relative z-10 w-5 h-5 text-primary-500 group-hover:rotate-12 transition-transform duration-500" />
                  <span class="relative z-10 text-sm font-black uppercase tracking-[0.1em] text-gray-700 dark:text-gray-200 group-hover:text-primary-500 transition-colors">
                    {{ article.shortId ? $t('blog.copyShortLink') : $t('blog.shareShortLink') }}
                  </span>

                  <!-- 悬浮扫光特效 -->
                  <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                </button>
              </div>

              <!-- 相关标签 -->
              <div v-if="article.tags?.length" class="mb-12 flex flex-wrap gap-4 justify-center">
                <span v-for="tag in article.tags" :key="`footer-${tag}`" class="text-xs font-bold text-gray-400 hover:text-primary-500 cursor-pointer transition-colors" @click="navigateToTag(tag)">
                  #{{ tag }}
                </span>
              </div>

              <!-- 上一篇/下一篇：极简卡片 -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <NuxtLink
                  v-if="article.adjacent?.prev"
                  :to="`/blogs/${article.adjacent.prev.path}`"
                  class="nav-link-premium prev group"
                >
                  <div class="nav-icon-premium group-hover:-translate-x-1">
                    <UIcon name="i-heroicons-arrow-left" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{{ $t('blog.prevArticle') }}</span>
                    <span class="text-sm font-bold truncate group-hover:text-primary-500 transition-colors">
                      {{ article.adjacent.prev.title }}
                    </span>
                  </div>
                </NuxtLink>
                <div v-else />

                <NuxtLink
                  v-if="article.adjacent?.next"
                  :to="`/blogs/${article.adjacent.next.path}`"
                  class="nav-link-premium next text-right group"
                >
                  <div class="flex flex-col min-w-0 order-2 md:order-1">
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{{ $t('blog.nextArticle') }}</span>
                    <span class="text-sm font-bold truncate group-hover:text-primary-500 transition-colors">
                      {{ article.adjacent.next.title }}
                    </span>
                  </div>
                  <div class="nav-icon-premium group-hover:translate-x-1 order-1 md:order-2">
                    <UIcon name="i-heroicons-arrow-right" />
                  </div>
                </NuxtLink>
              </div>

              <!-- 评论区 -->
              <div v-if="commentConfig.enableComments" class="comments-section-premium pt-8 border-t border-gray-100 dark:border-gray-800">
                <Giscus
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
              </div>
            </footer>
          </div>
        </UContainer>
      </main>

      <!-- 侧边大纲：极简导航 -->
      <ClientOnly>
        <aside class="toc-aside">
          <div class="toc-sticky-container">
            <nav class="toc-nav-premium shadow-2xl">
              <div class="toc-header px-5 py-4 border-b border-gray-100 dark:border-gray-800/50">
                <h4 class="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <span class="i-lucide-list-tree w-3.5 h-3.5 text-primary-500" />
                  {{ $t('blog.toc') }}
                </h4>
              </div>

              <div class="toc-body p-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                <div v-if="anchors.length > 0">
                  <UPageAnchors
                    :links="anchors"
                    class="premium-anchors"
                  />
                </div>
                <div v-else class="empty-toc py-12 text-center opacity-20">
                  <UIcon name="i-lucide-bookmark" class="w-8 h-8 mx-auto mb-2" />
                  <p class="text-[10px] font-bold uppercase tracking-widest">{{ $t('blog.tocGenerating') }}</p>
                </div>
              </div>
            </nav>
          </div>
        </aside>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.article-page-premium {
  --content-max-width: 900px;
  --toc-width: 260px;
  --layout-gap: 3.5rem;
  --navbar-height: 64px;
  --article-img-radius: 1.5rem;
}

/* 阅读进度条 */
.reading-progress-container {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 3px;
  z-index: 9999; pointer-events: none;
}

.reading-progress-bar {
  height: 100%;
  background: linear-gradient(to right, #6366f1, #a855f7);
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
  transition: width 0.15s ease-out;
}

/* 布局 */
.page-content {
  display: grid;
  grid-template-columns: 1fr minmax(0, var(--content-max-width)) var(--toc-width) 1fr;
  grid-template-areas: ". content toc .";
  gap: var(--layout-gap);
}

.article-content { grid-area: content; }
.toc-aside { grid-area: toc; }

/* 玻璃态卡片 */
.article-glass-card {
  background: white;
  border-radius: 2.5rem;
  border: 1px solid #f1f5f9;
}

.dark .article-glass-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(30px);
  border-color: rgba(255, 255, 255, 0.05);
}

/* 文章封面 */
.cover-image-inner {
  position: relative;
  overflow: hidden;
  border-radius: var(--article-img-radius);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* 比例与高度约束：防止长图灾难 */
  aspect-ratio: 16 / 7; 
  min-height: 240px;
  max-height: 460px;
  width: 100%;
}

@media (max-width: 768px) {
  .cover-image-inner {
    aspect-ratio: 16 / 9;
    max-height: 300px;
  }
}

.dark .cover-image-inner {
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
}

.cover-image-container {
  width: 100%;
  position: relative;
  z-index: 5; /* 确保不被后面内容遮挡，也不遮挡导航 */
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.2s cubic-bezier(0.2, 0, 0, 1);
}

/* 标题美学 */
.premium-title {
  font-size: 3rem;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.04em;
  color: #1e293b;
}

.dark .premium-title { color: #f8fafc; text-shadow: 0 4px 20px rgba(0,0,0,0.5); }

.premium-tag {
  display: inline-flex; align-items: center;
  padding: 0.4rem 1rem; background: #f1f5f9;
  color: #64748b; border-radius: 99px;
  font-size: 0.75rem; font-weight: 800; cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.premium-tag:hover { background: #4f46e5; color: white; transform: translateY(-3px) scale(1.05); }

.dark .premium-tag { background: rgba(255, 255, 255, 0.05); color: #94a3b8; }
.dark .premium-tag:hover { background: #6366f1; color: white; }

.meta-card-premium {
  padding: 1rem 1.5rem;
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 2rem;
  box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05);
  transition: all 0.3s;
  position: relative;
  z-index: 10;
}

.dark .meta-card-premium {
  background: rgba(15, 27, 42, 0.4);
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
  backdrop-filter: blur(20px);
}

/* 摘要 */
.premium-abstract {
  position: relative; padding: 1.75rem 2.25rem;
  background: #f8fafc; border-radius: 1.5rem;
}

.dark .premium-abstract { background: rgba(255, 255, 255, 0.02); }

.abstract-accent {
  position: absolute; left: 0; top: 1.75rem; bottom: 1.75rem;
  width: 4px; background: linear-gradient(to bottom, #6366f1, #a855f7);
  border-radius: 99px;
}

/* Markdown 正文排版深度优化 */
:deep(.markdown-body) {
  font-size: 1.125rem;
  line-height: 1.9;
  color: #334155;
  background-color: transparent !important;

  /* 标题层级优化 */
  h1, h2, h3, h4, h5, h6 {
    color: #1e293b !important;
    font-weight: 800 !important;
    margin-top: 2.5rem !important;
    margin-bottom: 1.25rem !important;
    line-height: 1.3 !important;
  }

  h1 { font-size: 2.25rem !important; border-bottom: 1px solid #f1f5f9 !important; padding-bottom: 0.5rem !important; }
  h2 { font-size: 1.875rem !important; border-bottom: 1px solid #f8fafc !important; padding-bottom: 0.3rem !important; }
  h3 { font-size: 1.5rem !important; }

  /* 显式修复列表展示问题 */
  ul {
    list-style-type: disc !important;
    padding-left: 1.8rem !important;
    margin-bottom: 1.5rem !important;
    list-style-position: outside !important;
  }

  ol {
    list-style-type: decimal !important;
    padding-left: 1.8rem !important;
    margin-bottom: 1.5rem !important;
    list-style-position: outside !important;
  }

  li {
    margin-bottom: 0.6rem !important;
    padding-left: 0.2rem !important;
    &::marker {
      color: #6366f1 !important; /* 赋予序号/圆点主题色 */
      font-weight: 700 !important;
    }
  }

  /* 处理嵌套列表 */
  li > ul, li > ol {
    margin-top: 0.5rem !important;
    margin-bottom: 0.5rem !important;
  }

  /* 嵌套列表标识符切换 */
  ul ul, ol ul { list-style-type: circle !important; }
  ul ul ul, ol ol ul { list-style-type: square !important; }

  /* 引用块样式 */
  blockquote {
    margin: 2rem 0 !important;
    padding: 1rem 1.5rem !important;
    color: #475569 !important;
    background: #f8fafc !important;
    border-left: 4px solid #6366f1 !important;
    border-radius: 0.5rem 1rem 1rem 0.5rem !important;
    font-style: italic !important;
    p { margin-bottom: 0 !important; }
  }

  /* 分割线 */
  hr {
    height: 1px !important;
    background: linear-gradient(to right, transparent, #e2e8f0, transparent) !important;
    border: none !important;
    margin: 3rem 0 !important;
  }
}

.dark :deep(.markdown-body) {
  color: #cbd5e1;
  h1, h2, h3, h4, h5, h6 { color: #f8fafc !important; border-bottom-color: rgba(255,255,255,0.05) !important; }
  blockquote {
    background: rgba(255, 255, 255, 0.03) !important;
    color: #94a3b8 !important;
    border-left-color: #818cf8 !important;
  }
  hr { background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent) !important; }
}

/* 行内代码样式还原 */
:deep(.markdown-body code:not(pre code)) {
  background-color: #f3f4f6 !important;
  color: #dc2626 !important;
  padding: 0.2rem 0.4rem !important;
  border-radius: 0.375rem !important;
  font-size: 0.85em !important;
  border: 1px solid #e5e7eb !important;
}

.dark :deep(.markdown-body code:not(pre code)) {
  background-color: #1f2937 !important;
  color: #f87171 !important;
  border-color: #374151 !important;
}

/* 代码块容器样式还原 (匹配截图) */
:deep(.markdown-body pre) {
  background-color: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 0.75rem !important;
  padding: 1.5rem !important;
  margin: 2rem 0 !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
}

.dark :deep(.markdown-body pre) {
  background-color: #0f172a !important;
  border-color: #1e293b !important;
  box-shadow: none !important;
}

/* 图片 */
:deep(.premium-markdown-body img) {
  max-width: 100%;
  border-radius: 1.5rem;
  margin: 2.5rem auto;
  box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.2);
  border: 1px solid #f1f5f9;
}

.dark :deep(.premium-markdown-body img) { border-color: rgba(255, 255, 255, 0.05); }

/* 表格 */
:deep(.premium-markdown-body table) {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 2rem 0;
  border: 1px solid #f1f5f9;
  border-radius: 1.25rem;
  overflow: hidden;
}

.dark :deep(.premium-markdown-body table) { border-color: rgba(255, 255, 255, 0.1); }

:deep(.premium-markdown-body th) {
  background: #f8fafc;
  padding: 1rem;
  font-weight: 800;
}

.dark :deep(.premium-markdown-body th) { background: rgba(255, 255, 255, 0.05); }

:deep(.premium-markdown-body td) {
  padding: 1rem;
  border-top: 1px solid #f1f5f9;
}

.dark :deep(.premium-markdown-body td) { border-top-color: rgba(255, 255, 255, 0.1); }

/* 底部导航卡片 */
.nav-link-premium {
  display: flex; align-items: center; gap: 1.25rem;
  padding: 1.25rem; background: white; border-radius: 1.5rem;
  border: 1px solid #f1f5f9; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.dark .nav-link-premium { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.05); }

.nav-link-premium:hover {
  transform: translateY(-5px); border-color: #4f46e5;
  box-shadow: 0 15px 30px -10px rgba(79, 70, 229, 0.15);
}

.nav-icon-premium {
  width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
  background: #f8fafc; color: #4f46e5; border-radius: 1rem; font-size: 1.25rem;
  transition: transform 0.3s;
}

.dark .nav-icon-premium { background: rgba(79, 70, 229, 0.1); }

/* TOC 侧边栏 */
.toc-sticky-container {
  position: sticky; top: calc(var(--navbar-height) + 3.5rem);
  max-height: calc(100vh - var(--navbar-height) - 5rem);
}

.toc-nav-premium {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(25px); border-radius: 2rem;
  border: 1px solid #f1f5f9; overflow: hidden;
}

.dark .toc-nav-premium { background: rgba(15, 23, 42, 0.85); border-color: rgba(255, 255, 255, 0.05); }

.premium-anchors :deep(a) {
  display: block;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  border-radius: 0.5rem;
  border-left: 2px solid transparent;
  transition: all 0.3s;
  
  /* 超出文本省略号截断 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.premium-anchors :deep(a.active) {
  color: #4f46e5;
  background: rgba(79, 70, 229, 0.08);
  border-left-color: #4f46e5;
  font-weight: 700;
  transform: translateX(4px);
}

.dark .premium-anchors :deep(a.active) {
  color: #818cf8;
  background: rgba(129, 140, 248, 0.1);
}

.premium-anchors :deep(a:hover:not(.active)) {
  color: #4f46e5;
  background: #f8fafc;
}

.dark .premium-anchors :deep(a:hover:not(.active)) {
  color: #818cf8;
  background: rgba(255, 255, 255, 0.02);
}

.toc-body { 
  overflow-y: auto; 
  overflow-x: hidden; /* 强制隐藏横向滑块 */
}

.toc-body::-webkit-scrollbar { width: 4px; }
.toc-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
.dark .toc-body::-webkit-scrollbar-thumb { background: #334155; }

/* 动画 */
@keyframes entrance { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.animate-article-entrance { animation: entrance 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards; }

@media (max-width: 1280px) {
  .page-content { grid-template-columns: 1fr minmax(0, var(--content-max-width)) 1fr; grid-template-areas: ". content ."; gap: 0; }
  .toc-aside { display: none; }
}

@media (max-width: 640px) {
  .premium-title { font-size: 2rem; }
  .article-glass-card { border-radius: 2rem; }
}
</style>

<style lang="less">
/* 定义亮色和暗色的官方样式混入 */
.hljs-light-theme() {
  @import (less) "highlight.js/styles/github.css";
}
.hljs-dark-theme() {
  @import (less) "highlight.js/styles/github-dark.css";
}

#preview-container {
  // 默认应用官方亮色主题
  .hljs-light-theme();

  // 当顶级标签有 .dark 类时，强制应用官方暗色主题，使用 !important 确保覆盖
  :global(.dark) & {
    .hljs-dark-theme() !important;
  }

  // 同时也适配 data-color-mode 属性
  &[data-color-mode="dark"] {
    .hljs-dark-theme() !important;
  }
}

/* 保持代码块的圆角和间距 (与 GitHub 样式兼容) */
#preview-container .hljs {
  padding: 1rem !important; /* pre 已经有 padding */
  background: transparent !important;
  border-radius: 0 !important;
  position: relative !important;
}

/* 极简复制按钮样式 */
.copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  background: transparent;
  border: 1px solid transparent;
  color: #64748b;
  opacity: 0;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

#preview-container .hljs:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

:global(.dark) .copy-btn {
  color: #94a3b8;
}

:global(.dark) .copy-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
}
</style>
