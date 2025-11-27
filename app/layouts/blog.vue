<template>
  <div class="gd-container font-spacegrotesk">
    <header class="fixed w-full  dark:bg-slate-950 z-10">
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
