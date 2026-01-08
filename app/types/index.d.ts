import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'

export interface UploadResponse {
  success: boolean
  url: string
  filename: string
  originalName?: string
  size?: number
}

export interface FileValidation {
  maxSize: number // bytes
  allowedTypes: string[]
}
export interface User {
  id: number
  name: string
  username: string
  password: string
  email: string
  avatar: string
  bio: string
  created_at: string
}
export interface Result<T> {
  success: boolean
  err: string
  data: T
}

export interface Article {
  path: string// 路径
  title: string // 文章标题
  date: string // 创建时间
  description: string | null // 文章描述
  image: string | null // 文章图片
  tags: string[] // 标签
  published: boolean // 是否发布
  content: string // md内容
  modifyTime: string // 修改时间
  isSaved: boolean // 是否保存到数据库
  author: string
  avatar: string
  newBlog: boolean | false
  isSticky: boolean // 是否置顶
}

// 保存文章的入参类型（兼容新增和编辑）
type SaveArticleParams = Omit<Article, 'tags' | 'modifyTime' | 'content' | 'isSaved' | 'author' | 'avatar' | 'newBlog'> & {
  tags: string[]
  // 编辑时可选字段，新增时必传核心字段（title/date/content）
  title?: string
  date?: string
  content?: string
  userid: number
}

export interface Customer {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface NavbarData {
  homeTitle: string
}

export interface FooterData {
  author: string
  aboutAuthor: string
  authorInterest: string
  aboutTheSite: string
}

export interface PageInfo {
  title: string
  description: string
  aboutMe?: string
}

export interface SocialLink {
  icon: string
  to: string
  label: string
}

export interface SeoData {
  title: string
  ogTitle: string
  description?: string
  ogDescription?: string
  mailAddress: string
}

export interface AppConfig {
  navbarData: NavbarData
  footerData: FooterData
  homePage: PageInfo
  blogsPage: PageInfo
  tagsPage: PageInfo
  aboutPage: PageInfo
  seoData: SeoData
  socialLinks: SocialLink[]
  GiscusData?: unknown
}
