// 앱 시작 시(서버/클라이언트) 쿠키의 토큰으로 로그인 상태를 복구한다.
// -> 새로고침해도 로그인 상태가 유지된다.
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  await auth.fetchMe();
});
