<script setup lang="ts">
const route = useRoute()
const { shortId } = route.params
const localePath = useLocalePath()

const { data, error } = await useAsyncData(`resolve-short-${shortId}`, () => 
  $fetch<any>(`/api/s/${shortId}`)
)

if (error.value || !data.value?.success) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Short link not found'
  })
}

// 执行跳转
if (data.value?.data?.path) {
  const targetPath = localePath(`/blogs/${data.value.data.path}`)
  navigateTo(targetPath, { replace: true, redirectCode: 301 })
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
      <p class="text-gray-500 font-medium">Redirecting to article...</p>
    </div>
  </div>
</template>
