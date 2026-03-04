<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNavbarData } from '~/data'

const navbarData = useNavbarData()
const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const search = ref(route.query.search?.toString() || '')
const isScrolled = ref(false)

// Logo 三连击跳转后台
let logoClickCount = 0
let logoClickTimer: ReturnType<typeof setTimeout> | null = null

const handleLogoClick = (e: MouseEvent) => {
  logoClickCount++
  // 清除之前的定时器
  if (logoClickTimer) {
    clearTimeout(logoClickTimer)
  }

  // 如果点击次数达到3次或以上,跳转到后台
  if (logoClickCount >= 3) {
    e.preventDefault() // 阻止默认导航
    navigateTo(localePath('/admin'))
    logoClickCount = 0
  } else {
    // 500ms 内没有新的点击,重置计数
    logoClickTimer = setTimeout(() => {
      logoClickCount = 0
    }, 500)
  }
}

// 监听滚动状态，实现导航栏背景变化
onMounted(() => {
  const handleScroll = () => {
    isScrolled.value = window.scrollY > 20
  }
  window.addEventListener('scroll', handleScroll)
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
})

// 监听路由参数变化，同步搜索框内容
watch(() => route.query.search, (newSearch) => {
  search.value = newSearch?.toString() || ''
})

const handleSearch = () => {
  navigateTo({
    path: localePath('/'),
    query: {
      ...route.query,
      search: search.value || undefined,
      page: 1
    }
  })
}

const { data: travelData } = await useFetch<{ success: boolean, visible: boolean }>('/api/travel/records')
const showTravel = computed(() => travelData.value?.success && travelData.value?.visible)

const navItems = computed(() => {
  const items = [
    { label: t('nav.tags'), to: localePath('/tags'), icon: 'i-lucide-tags' }
  ]

  if (showTravel.value) {
    items.push({ label: t('nav.travel'), to: localePath('/travel'), icon: 'i-lucide-map' })
  }

  items.push({ label: t('nav.about'), to: localePath('/about'), icon: 'i-lucide-user' })

  return items
})

const navigationState = computed(() => {
  return navItems.value.map(item => ({
    ...item,
    active: item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)
  }))
})

const isHomeActive = computed(() => route.path === '/')

const toggleLocale = () => {
  setLocale(locale.value === 'en' ? 'zh-CN' : 'en')
}

// 移动端菜单状态
const mobileMenuOpen = ref(false)
</script>

<template>
  <nav
    class="navbar-modern"
    :class="{ 'navbar-scrolled': isScrolled }"
  >
    <UContainer class="max-w-7xl">
      <div class="navbar-content">
        <!-- Left: Logo with animated gradient -->
        <div class="navbar-left">
          <ULink
            to="/"
            class="logo-link"
            :class="{ 'logo-active': isHomeActive }"
            @click="handleLogoClick"
          >
            <div class="logo-wrapper">
              <span class="logo-text">{{ navbarData.homeTitle }}</span>
              <div class="logo-underline" />
            </div>
          </ULink>

          <!-- Desktop Navigation with modern styling -->
          <div class="nav-items-desktop">
            <ULink
              v-for="item in navigationState"
              :key="item.to"
              :to="item.to"
              class="nav-item"
              :class="{ 'nav-item-active': item.active }"
            >
              <Icon :name="item.icon" class="nav-icon" />
              <span class="nav-label">{{ item.label }}</span>
              <div v-if="item.active" class="nav-active-indicator" />
            </ULink>
          </div>
        </div>

        <!-- Center: Modern Search Bar with glassmorphism -->
        <div class="search-container">
          <div class="search-wrapper">
            <Icon name="i-lucide-search" class="search-icon" />
            <input
              v-model="search"
              type="text"
              :placeholder="t('blog.searchPlaceholder')"
              class="search-input"
              @keydown.enter="handleSearch"
            >
            <kbd class="search-kbd">⌘K</kbd>
          </div>
        </div>

        <!-- Right: Action Buttons -->
        <div class="navbar-actions">
          <UButton
            icon="i-simple-icons-github"
            size="sm"
            variant="ghost"
            color="neutral"
            class="action-btn"
            to="https://github.com/chao-eng/nuxt-blog-site"
            target="_blank"
            aria-label="GitHub"
          />
          <UButton
            :aria-label="locale === 'en' ? 'Switch to Chinese' : '切换到英文'"
            :icon="locale === 'en' ? 'i-lucide-languages' : 'i-lucide-globe'"
            size="sm"
            variant="ghost"
            color="neutral"
            class="action-btn"
            @click="toggleLocale"
          />
          <UColorModeButton
            size="sm"
            variant="ghost"
            color="neutral"
            class="action-btn"
          />
          <!-- Mobile Menu Toggle -->
          <UButton
            aria-label="Toggle menu"
            :icon="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
            size="sm"
            variant="ghost"
            color="neutral"
            class="action-btn mobile-menu-btn"
            @click="mobileMenuOpen = !mobileMenuOpen"
          />
        </div>
      </div>

      <!-- Mobile Menu Dropdown -->
      <Transition name="mobile-menu">
        <div v-if="mobileMenuOpen" class="mobile-menu">
          <div class="mobile-search">
            <Icon name="i-lucide-search" class="mobile-search-icon" />
            <input
              v-model="search"
              type="text"
              :placeholder="t('blog.searchPlaceholder')"
              class="mobile-search-input"
              @keydown.enter="handleSearch(); mobileMenuOpen = false"
            >
          </div>
          <div class="mobile-nav-items">
            <ULink
              v-for="item in navigationState"
              :key="item.to"
              :to="item.to"
              class="mobile-nav-item"
              :class="{ 'mobile-nav-item-active': item.active }"
              @click="mobileMenuOpen = false"
            >
              <Icon :name="item.icon" class="mobile-nav-icon" />
              <span>{{ item.label }}</span>
              <Icon v-if="item.active" name="i-lucide-check" class="mobile-nav-check" />
            </ULink>
          </div>
        </div>
      </Transition>
    </UContainer>
  </nav>
</template>

<style scoped>
/* ===== 主导航栏样式 ===== */
.navbar-modern {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* 玻璃态效果 */
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .navbar-modern {
  background: rgba(9, 9, 11, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* 滚动后的导航栏 */
.navbar-scrolled {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.08);
}

.dark .navbar-scrolled {
  background: rgba(9, 9, 11, 0.85);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
}

/* ===== 导航栏内容布局 ===== */
.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4.5rem;
  gap: 1.5rem;
}

/* ===== Logo 区域 ===== */
.navbar-left {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-shrink: 0;
}

.logo-link {
  text-decoration: none;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.logo-link:hover {
  transform: translateY(-2px) scale(1.02);
}

.logo-wrapper {
  position: relative;
  padding: 0.25rem 0;
}

.logo-text {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #6366F1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
}

.dark .logo-text {
  background: linear-gradient(135deg, #818CF8 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-underline {
  position: absolute;
  bottom: -2px;
  left: 0;
  height: 3px;
  width: 0;
  border-radius: 2px;
  background: linear-gradient(90deg, #6366F1, #8b5cf6);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-link:hover .logo-underline,
.logo-active .logo-underline {
  width: 100%;
}

/* ===== 桌面导航项 ===== */
.nav-items-desktop {
  display: none;
  align-items: center;
  gap: 0.25rem;
}

@media (min-width: 768px) {
  .nav-items-desktop {
    display: flex;
  }
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border-radius: 0.85rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(82, 82, 91);
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.dark .nav-item {
  color: rgb(161, 161, 170);
}

.nav-item:hover {
  color: rgb(24, 24, 27);
  background: rgba(99, 102, 241, 0.06);
  transform: translateY(-1px);
}

.dark .nav-item:hover {
  color: rgb(250, 250, 250);
  background: rgba(255, 255, 255, 0.05);
}

.nav-icon {
  width: 1.1rem;
  height: 1.1rem;
  transition: transform 0.2s ease;
}

.nav-item:hover .nav-icon {
  transform: scale(1.15) rotate(-5deg);
}

.nav-item-active {
  color: #6366F1;
  background: rgba(99, 102, 241, 0.08) !important;
}

.dark .nav-item-active {
  color: #818CF8;
  background: rgba(129, 140, 248, 0.1) !important;
}

.nav-active-indicator {
  position: absolute;
  bottom: 0.4rem;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #6366F1;
  box-shadow: 0 0 8px #6366F1;
  animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.4;
    transform: translateX(-50%) scale(1.5);
  }
}

/* ===== 搜索框 ===== */
.search-container {
  flex: 1;
  max-width: 24rem;
  display: none;
}

@media (min-width: 768px) {
  .search-container {
    display: block;
  }
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 1rem;
  padding: 0.55rem 1.1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.dark .search-wrapper {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.search-wrapper:focus-within {
  background: white;
  border-color: #6366F1;
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.dark .search-wrapper:focus-within {
  background: rgba(30, 41, 59, 0.7);
  border-color: #818CF8;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

.search-icon {
  width: 1.2rem;
  height: 1.2rem;
  color: rgb(113, 113, 122);
  flex-shrink: 0;
  transition: color 0.3s ease;
}

.search-wrapper:focus-within .search-icon {
  color: #6366F1;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 0 0.85rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgb(24, 24, 27);
}

.dark .search-input {
  color: rgb(250, 250, 250);
}

.search-kbd {
  display: none;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgb(113, 113, 122);
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

@media (min-width: 1024px) {
  .search-kbd {
    display: block;
  }
}

/* ===== 操作按钮 ===== */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.action-btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  border-radius: 0.75rem !important;
}

.action-btn:hover {
  background: rgba(99, 102, 241, 0.08) !important;
  transform: translateY(-2px);
  color: #6366F1 !important;
}

.dark .action-btn:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #818CF8 !important;
}

.mobile-menu-btn {
  display: block;
}

@media (min-width: 768px) {
  .mobile-menu-btn {
    display: none;
  }
}

/* ===== 移动端菜单 ===== */
.mobile-menu {
  display: block;
  padding: 1rem 0;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
}

.dark .mobile-menu {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(9, 9, 11, 0.95);
}

@media (min-width: 768px) {
  .mobile-menu {
    display: none;
  }
}

.mobile-search {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  background: rgba(244, 244, 245, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 0.75rem;
}

.dark .mobile-search {
  background: rgba(39, 39, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-search-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: rgb(113, 113, 122);
}

.mobile-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1rem;
  color: rgb(24, 24, 27);
}

.dark .mobile-search-input {
  color: rgb(250, 250, 250);
}

.mobile-search-input::placeholder {
  color: rgb(161, 161, 170);
}

.mobile-nav-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  color: rgb(82, 82, 91);
  text-decoration: none;
  transition: all 0.2s ease;
}

.dark .mobile-nav-item {
  color: rgb(161, 161, 170);
}

.mobile-nav-item:hover {
  background: rgba(244, 244, 245, 0.8);
  color: rgb(24, 24, 27);
}

.dark .mobile-nav-item:hover {
  background: rgba(39, 39, 42, 0.8);
  color: rgb(250, 250, 250);
}

.mobile-nav-item-active {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
}

.dark .mobile-nav-item-active {
  background: rgba(129, 140, 248, 0.1);
  color: #818CF8;
}

.mobile-nav-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.mobile-nav-check {
  margin-left: auto;
  width: 1rem;
  height: 1rem;
}

/* ===== 移动端菜单动画 ===== */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
</style>
