<script setup lang="ts">
const localePath = useLocalePath()
definePageMeta({
  middleware: [
    function (to, from) {
      const localePath = useLocalePath()
      return navigateTo(localePath('/'), { redirectCode: 301 })
    }
  ]
})
</script>
<template>
  <div />
</template>
