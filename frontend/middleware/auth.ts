// 인증이 필요한 페이지 보호용 라우트 가드.
// 사용법: definePageMeta({ middleware: 'auth' })
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  if (!auth.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
