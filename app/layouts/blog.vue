<template>
  <div class="gd-container font-spacegrotesk bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30 dark:bg-none dark:bg-none dark:bg-slate-950">
    <header class="fixed w-full bg-white/60 backdrop-blur-md dark:bg-slate-950/80 z-10 border-b border-gray-200/50 dark:border-gray-800/50">
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
