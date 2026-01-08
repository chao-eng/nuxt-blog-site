import type { NavbarData, FooterData, PageInfo, SeoData, SocialLink, AppConfig } from '~/types'

export const useNavbarData = () => useRuntimeConfig().public.appConfig.navbarData as NavbarData

export const useFooterData = () => useRuntimeConfig().public.appConfig.footerData as FooterData

export const useHomePage = () => useRuntimeConfig().public.appConfig.homePage as PageInfo

export const useBlogsPage = () => useRuntimeConfig().public.appConfig.blogsPage as PageInfo

export const useTagsPage = () => useRuntimeConfig().public.appConfig.tagsPage as PageInfo

export const useAboutPage = () => useRuntimeConfig().public.appConfig.aboutPage as PageInfo

export const useSeoData = () => useRuntimeConfig().public.appConfig.seoData as SeoData

export const useSocialLinks = () => useRuntimeConfig().public.appConfig.socialLinks as SocialLink[]

export const useAppConfig = () => useRuntimeConfig().public.appConfig as AppConfig

export const useGiscusData = () => useAppConfig().GiscusData as unknown
