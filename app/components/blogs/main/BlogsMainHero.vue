<script setup lang="ts">
import { useHomePage, useAboutPage, useSocialLinks } from '~/data'

const homePage = useHomePage()
const aboutPage = useAboutPage()
const socialLinks = useSocialLinks()
const localePath = useLocalePath()
</script>

<template>
  <div class="container mx-auto py-8 ">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      <!-- 原有的标题区域 -->
      <div class="px-6">
        <h1 class="text-black dark:text-zinc-300 font-semibold leading-tight text-4xl md:text-5xl my-5">
          {{ homePage.title }}
        </h1>
        <p class="dark:text-zinc-300 text-lg">
          {{ homePage.description }}
        </p>
      </div>

      <!-- 新增的关于我区域 -->
      <div class="px-6 ">
        <UCard class="shadow-lg bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30 dark:bg-none ">
          <div class="text-center space-y-6">
            <!-- 头像 -->
            <div class="flex justify-center">
              <img
                src="/logo.webp"
                alt="个人头像"
                class="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              >
            </div>

            <!-- 基本信息 -->
            <div class="space-y-3">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                关于我
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ aboutPage.description }}
              </p>
            </div>

            <!-- 社交链接 -->
            <div class="flex justify-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  class="hover:text-primary-500 dark:text-gray-300 transition-colors"
                />
              </UTooltip>
            </div>

            <!-- 查看更多按钮 -->
            <div class="pt-2">
              <UButton
                :to="localePath('/about')"
                variant="outline"
                size="sm"
                class="text-xs"
              >
                了解更多
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
