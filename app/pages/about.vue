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
  <UContainer class="py-8 max-w-4xl">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30 dark:bg-none p-8 md:p-12">
        <div class="max-w-2xl mx-auto space-y-12">
          <!-- 头像和基本信息 -->
          <div class="text-center space-y-6">
            <img
              src="/logo.png"
              :alt="aboutPage.title"
              class="w-24 h-24 mx-auto rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-700"
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
            <div class="flex justify-center gap-3 pt-2">
              <UTooltip
                v-for="social in socialLinks"
                :key="social.label"
                :text="social.label"
                :popper="{ placement: 'top' }"
              >
                <UButton
                  :icon="social.icon"
                  :to="social.to"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  target="_blank"
                  :aria-label="social.label"
                  class="hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                />
              </UTooltip>
            </div>
          </div>

          <!-- 关于我内容 -->
          <div class="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              关于我
            </h2>

            <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
              {{ aboutPage.aboutMe }}
            </p>
          </div>

          <!-- 联系方式 -->
          <div class="text-center pt-6 border-t border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <UIcon name="i-lucide-mail" class="w-4 h-4" />
              <span class="text-sm">随时欢迎交流与合作</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
