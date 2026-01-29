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
</script>

<style scoped>
.gd-container {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
}
</style>
