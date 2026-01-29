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
  <main class="deep-space-bg min-h-screen">
    <UContainer class="max-w-4xl py-12">
      <!-- 个人信息卡片 -->
      <div class="about-card">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img
              src="/logo.webp"
              :alt="aboutPage.title"
              class="avatar-image"
            >
            <div class="avatar-ring" />
            <div class="avatar-glow" />
          </div>
        </div>

        <!-- 个人信息 -->
        <div class="info-section">
          <h1 class="name-title gradient-text">
            {{ aboutPage.title }}
          </h1>

          <p class="role-description">
            {{ aboutPage.description }}
          </p>

          <!-- 社交链接 -->
          <div class="social-links">
            <a
              v-for="social in socialLinks"
              :key="social.label"
              :href="social.to"
              target="_blank"
              rel="noopener noreferrer"
              class="social-link"
              :aria-label="social.label"
            >
              <Icon :name="social.icon" class="social-icon" />
              <span class="social-label">{{ social.label }}</span>
            </a>
          </div>
        </div>

        <!-- 关于我内容 -->
        <div class="content-section">
          <div class="section-header">
            <Icon name="i-lucide-user" class="section-icon" />
            <h2 class="section-title">关于我</h2>
          </div>

          <p class="content-text">
            {{ aboutPage.aboutMe }}
          </p>
        </div>

        <!-- 联系方式 -->
        <div class="contact-section">
          <div class="contact-card">
            <Icon name="i-lucide-mail" class="contact-icon" />
            <div class="contact-content">
              <h3 class="contact-title">随时欢迎交流与合作</h3>
              <p class="contact-description">如果你对我的工作感兴趣，或者想要一起探讨技术话题，欢迎通过社交媒体联系我。</p>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </main>
</template>

<style scoped>
/* ===== 关于卡片 ===== */
.about-card {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.6s ease-out;
}

.dark .about-card {
  background: rgba(39, 39, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .about-card {
    padding: 2rem 1.5rem;
    gap: 2rem;
  }
}

/* ===== 头像区域 ===== */
.avatar-section {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.avatar-wrapper {
  position: relative;
  width: 10rem;
  height: 10rem;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 2;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.avatar-ring {
  position: absolute;
  inset: -0.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  opacity: 0.2;
  z-index: 1;
  animation: rotate 10s linear infinite;
}

.dark .avatar-ring {
  background: linear-gradient(135deg, #818CF8, #6366F1);
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.avatar-glow {
  position: absolute;
  inset: -30%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%);
  filter: blur(30px);
  z-index: 0;
  animation: pulse 3s ease-in-out infinite;
}

/* ===== 个人信息 ===== */
.info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
}

.name-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .name-title {
    font-size: 2rem;
  }
}

.role-description {
  font-size: 1.25rem;
  line-height: 1.6;
  color: rgb(113, 113, 122);
  max-width: 32rem;
}

.dark .role-description {
  color: rgb(161, 161, 170);
}

/* ===== 社交链接 ===== */
.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 0.75rem;
  text-decoration: none;
  color: #6366F1;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dark .social-link {
  background: rgba(129, 140, 248, 0.1);
  border-color: rgba(129, 140, 248, 0.2);
  color: #818CF8;
}

.social-link:hover {
  transform: translateY(-2px);
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.2);
}

.dark .social-link:hover {
  background: rgba(129, 140, 248, 0.2);
  border-color: rgba(129, 140, 248, 0.4);
  box-shadow: 0 10px 15px -3px rgba(129, 140, 248, 0.2);
}

.social-icon {
  width: 1.125rem;
  height: 1.125rem;
}

.social-label {
  font-weight: 500;
}

/* ===== 内容区域 ===== */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.dark .content-section {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #6366F1;
}

.dark .section-icon {
  color: #818CF8;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(24, 24, 27);
}

.dark .section-title {
  color: rgb(250, 250, 250);
}

.content-text {
  font-size: 1.125rem;
  line-height: 1.8;
  color: rgb(63, 63, 70);
}

.dark .content-text {
  color: rgb(212, 212, 216);
}

/* ===== 联系区域 ===== */
.contact-section {
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.dark .contact-section {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.contact-card {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(79, 70, 229, 0.05));
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 1rem;
  transition: all 0.3s ease;
}

.dark .contact-card {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.05), rgba(99, 102, 241, 0.05));
  border-color: rgba(129, 140, 248, 0.15);
}

.contact-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1);
}

.contact-icon {
  width: 2rem;
  height: 2rem;
  color: #6366F1;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.dark .contact-icon {
  color: #818CF8;
}

.contact-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(24, 24, 27);
}

.dark .contact-title {
  color: rgb(250, 250, 250);
}

.contact-description {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgb(113, 113, 122);
}

.dark .contact-description {
  color: rgb(161, 161, 170);
}
</style>
