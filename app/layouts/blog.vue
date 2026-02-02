<template>
  <div class="gd-container font-spacegrotesk bg-gray-50 dark:bg-zinc-950">
    <!-- 使用新的现代化导航栏 -->
    <BlogsMainHeaderModern />

    <main>
      <div class="p-9" />
      <slot />
    </main>

    <footer>
      <BlogsMainFooter />
    </footer>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()

// 键盘暗号"admin"跳转后台
let inputBuffer = ''
let bufferTimer: ReturnType<typeof setTimeout> | null = null

const handleKeyPress = (e: KeyboardEvent) => {
  // 检查是否在输入框中
  const target = e.target as HTMLElement
  const isInputElement = 
    target.tagName === 'INPUT' || 
    target.tagName === 'TEXTAREA' || 
    target.isContentEditable

  // 如果在输入框中,不处理
  if (isInputElement) {
    return
  }

  // 清除之前的定时器
  if (bufferTimer) {
    clearTimeout(bufferTimer)
  }

  // 将按键添加到缓冲区,只保留最后5个字符
  inputBuffer = (inputBuffer + e.key).slice(-5).toLowerCase()

  // 检查是否输入了"admin"
  if (inputBuffer === 'admin') {
    navigateTo(localePath('/admin/travel'))
    inputBuffer = '' // 重置缓冲区
  } else {
    // 1秒内没有新的按键,清空缓冲区
    bufferTimer = setTimeout(() => {
      inputBuffer = ''
    }, 1000)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  if (bufferTimer) {
    clearTimeout(bufferTimer)
  }
})
</script>

<style scoped>
.gd-container {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
}
</style>
