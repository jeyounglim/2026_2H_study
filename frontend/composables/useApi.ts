// 공통 API 요청 계층.
// - baseURL 자동 적용
// - 요청마다 JWT 토큰(쿠키)을 Authorization 헤더로 자동 첨부
// - 401(토큰 만료/무효) 응답 시 공통 로그아웃 처리 + 로그인 페이지로 이동
export function useApi() {
  const config = useRuntimeConfig();
  const token = useCookie<string | null>('token');

  return $fetch.create({
    baseURL: config.public.apiBase,

    onRequest({ options }) {
      if (token.value) {
        options.headers = new Headers(options.headers as HeadersInit);
        options.headers.set('Authorization', `Bearer ${token.value}`);
      }
    },

    onResponseError({ response }) {
      if (response.status === 401) {
        token.value = null;
        if (import.meta.client) {
          try {
            const auth = useAuthStore();
            auth.user = null;
          } catch {
            // pinia 컨텍스트 밖일 수 있으므로 무시
          }
          // 로그인 페이지가 아니면 이동
          if (useRoute().path !== '/login') {
            navigateTo('/login');
          }
        }
      }
    },
  });
}
