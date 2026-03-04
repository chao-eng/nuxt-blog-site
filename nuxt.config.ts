// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

// 编译时加载 app_config.yml 作为默认配置
// Docker 运行时可通过环境变量覆盖
const appConfigPath = resolve(process.cwd(), 'app_config.yml')
let appConfig: Record<string, unknown> = {}
try {
  const fileContents = fs.readFileSync(appConfigPath, 'utf8')
  appConfig = yaml.load(fileContents) as Record<string, unknown>
  console.log('✅ Successfully loaded app config from:', appConfigPath)
} catch (e) {
  console.error('❌ Failed to load app config:', e)
}

export default defineNuxtConfig({

  modules: [
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@sidebase/nuxt-auth',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },
  app: {
    head: {
      script: [],
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    fonts: false
  },

  runtimeConfig: {
    // 🔐 私有配置（仅服务端可用）
    // 运行时通过环境变量覆盖：NUXT_STATIC_PATH, NUXT_BASE_PATH, NUXT_DB_PATH, NUXT_AUTH__SECRET

    auth: {
      excludedPaths: [
        '/api/auth/login',
        '/api/notifications',
        '/api/_nuxt_icon/*',
        '/api/blogs/all',
        '/api/blogs/content',
        '/api/blogs/tags',
        '/api/blogs/getArticleTags',
        '/api/fetch*',
        '/api/article/fetch*',
        '/api/s/*',
        '/api/travel/records',
        '/api/comments/config',
        '/api/umami/config',
        '/api/map/geojson',
        '/api/umami/stats',
        '/api/test/*'
      ]
    },

    // 提供默认值，Docker 启动时可通过环境变量覆盖
    staticPath: '/app/static',
    basePath: '/blog',
    dbPath: '/app/data/blog.db',
    authSecret: 'change-me-in-production',

    // 🌐 公共配置（客户端和服务端都可用）
    public: {
      appConfig
    }
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
  },

  sourcemap: {
    server: false,
    client: false
  },

  devServer: {
    host: '0.0.0.0'
  },

  compatibilityDate: '2024-07-11',
  auth: {
    globalAppMiddleware: false,
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: 'login', method: 'post' },
        signOut: { path: 'logout', method: 'post' },
        // signUp: { path: '/register', method: 'post' },
        getSession: { path: 'user', method: 'get' }
      },
      token: {
        signInResponseTokenPointer: '/token',
        type: 'Bearer',
        headerName: 'Authorization',
        maxAge: 1000 * 60 * 60 * 24 * 7
      },
      sessionDataType: {
        id: 'number',
        username: 'string',
        name: 'string',
        avatar: 'string',
        email: 'string'
      },
      pages: {
        login: '/admin/login'
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    locales: [
      {
        code: 'en',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'zh-CN',
        file: 'zh-CN.json',
        name: '简体中文'
      }
    ],
    langDir: 'locales',
    defaultLocale: 'zh-CN',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
