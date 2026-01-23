<template>
  <div class="gd-container font-spacegrotesk bg-gray-50 dark:bg-zinc-950">
    <header class="fixed w-full bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-800">
      <BlogsMainHeader />
    </header>

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
