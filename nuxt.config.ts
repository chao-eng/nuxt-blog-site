// https://nuxt.com/docs/api/configuration/nuxt-config
import { config } from 'dotenv'
import { resolve } from 'path'
import fs from 'fs'
import yaml from 'js-yaml'

const envFile = `.env.${process.env.NODE_ENV}`
const envPath = resolve(process.cwd(), envFile)

console.log(`🔧 Manually loading: ${envPath}`)
const result = config({ path: envPath, override: true })
if (result.error) {
  console.error('❌ Failed to load env file:', result.error)
} else {
  console.log('✅ Successfully loaded env file')
  console.log('📄 Loaded variables:', Object.keys(result.parsed || {}))
}

const appConfigPath = resolve(process.cwd(), 'app_config.yml')
let appConfig: Record<string, any> = {}
try {
  const fileContents = fs.readFileSync(resolve(process.cwd(), appConfigPath), 'utf8')
  appConfig = yaml.load(fileContents) as Record<string, any>
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
  }, app: {
    head: {
      script: []
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    fonts: false
  }, runtimeConfig: {
    auth: {
      excludedPaths: [
        '/api/auth/login',
        '/api/notifications',
        '/api/_nuxt_icon/*',
        '/api/blogs/recent',
        '/api/blogs/sticky',
        '/api/blogs/all',
        '/api/blogs/content',
        '/api/blogs/tags',
        '/api/blogs/getArticleTags',
        '/api/fetch*',
        '/api/article/fetch*',
        '/api/travel/records',
        '/api/comments/config',
        '/api/umami/config',
        '/api/map/geojson',
        '/api/umami/stats'
      ]
    },
    staticPath: process.env.NUXT_STATIC_PATH,
    basePath: process.env.NUXT_BASE_PATH,
    dbPath: process.env.NUXT_DB_PATH,
    authSecret: process.env.NUXT_AUTH__SECRET,
    public: {
      appConfig
    }
  },

  routeRules: {
    '/api/**': {
      cors: true
    }
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
    lazy: true,
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
