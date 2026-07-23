// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  // Windows(소문자 드라이브 문자) 환경에서 path.relative + ignore 패키지가
  // 던지는 RangeError 를 회피하기 위한 옵션.
  ignoreOptions: { allowRelativePaths: true },
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000/api',
    },
  },
  app: {
    head: {
      title: 'Code-Q&A — 개발 질의응답 포럼',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: '프로젝트 중 막힌 점을 질문하고, 답변으로 함께 해결하는 Code-Q&A 포럼입니다.',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
        },
      ],
    },
  },
});
