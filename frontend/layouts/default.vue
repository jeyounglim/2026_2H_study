<script setup lang="ts">
const auth = useAuthStore();
const config = useRuntimeConfig();

const swaggerUrl = computed(() =>
  config.public.apiBase.replace(/\/api\/?$/, '/api-docs'),
);

async function handleLogout() {
  auth.logout();
  await navigateTo('/login');
}
</script>

<template>
  <div class="page">
    <header class="navbar">
      <div class="navbar-inner">
        <NuxtLink to="/posts" class="brand">Study</NuxtLink>
        <nav class="nav-links">
          <NuxtLink to="/posts" class="nav-link">게시판</NuxtLink>
          <template v-if="auth.isLoggedIn">
            <NuxtLink to="/mypage" class="nav-avatar-link" title="마이페이지">
              <UserAvatar
                size="sm"
                :email="auth.user?.email"
                :nickname="auth.user?.nickname"
                :profile-image="auth.user?.profileImage"
              />
            </NuxtLink>
            <button class="btn-ghost btn-sm" @click="handleLogout">로그아웃</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="nav-link">로그인</NuxtLink>
            <NuxtLink to="/register" class="btn btn-sm">회원가입</NuxtLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <slot />
      </div>
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <span class="footer-text">Copyright © 2026 Board Study. All rights reserved.</span>
        <div class="footer-links">
          <NuxtLink to="/posts" class="footer-link">게시판</NuxtLink>
          <a :href="swaggerUrl" target="_blank" rel="noopener" class="footer-link">API 문서</a>
        </div>
      </div>
    </footer>
  </div>
</template>
