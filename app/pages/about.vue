<script setup lang="ts">
import { useAboutPage, useFooterData, useSocialLinks } from '~/data'

const aboutPage = useAboutPage()
const footerData = useFooterData()
const socialLinks = useSocialLinks()

definePageMeta({
  layout: 'blog'
})

useHead({
  title: '关于我',
  meta: [
    {
      name: 'description',
      content: footerData.aboutAuthor
    }
  ]
})
</script>

<template>
  <UContainer class="py-16 max-w-3xl">
    <div class="max-w-2xl mx-auto space-y-16">
      <!-- 头像和基本信息 -->
      <div class="text-center space-y-8">
        <img
          src="/logo.png"
          :alt="aboutPage.title"
          class="w-24 h-24 mx-auto rounded-full object-cover"
        >

        <div class="space-y-3">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ aboutPage.title }}
          </h1>

          <p class="text-lg text-gray-600 dark:text-gray-400">
            {{ aboutPage.description }}
          </p>
        </div>

        <!-- 社交链接 -->
        <div class="flex justify-center gap-4">
          <UButton
            v-for="social in socialLinks"
            :key="social.label"
            :icon="social.icon"
            :to="social.to"
            variant="ghost"
            color="gray"
            size="sm"
            target="_blank"
            :aria-label="social.label"
            class="hover:text-primary-500 transition-colors"
          />
        </div>
      </div>

      <!-- 关于我内容 -->
      <div class="space-y-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          关于我
        </h2>

        <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
          {{ aboutPage.aboutMe }}
        </p>
      </div>

      <!-- 联系方式 -->
      <div class="text-center pt-8 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
          <UIcon name="i-lucide-mail" class="w-4 h-4" />
          <span class="text-sm">随时欢迎交流与合作</span>
        </div>
      </div>
    </div>
  </UContainer>
</template>
