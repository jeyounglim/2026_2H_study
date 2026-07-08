<script setup lang="ts">
const auth = useAuthStore();

async function handleLogout() {
  auth.logout();
  await navigateTo('/login');
}
</script>

<template>
  <div>
    <header class="navbar">
      <div class="navbar-inner">
        <NuxtLink to="/posts" class="brand">Board</NuxtLink>
        <nav class="nav-actions">
          <template v-if="auth.isLoggedIn">
            <span class="muted">{{ auth.user?.nickname }} 님</span>
            <NuxtLink to="/posts/new" class="btn btn-sm">글쓰기</NuxtLink>
            <button class="btn btn-outline btn-sm" @click="handleLogout">로그아웃</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="btn btn-outline btn-sm">로그인</NuxtLink>
            <NuxtLink to="/register" class="btn btn-sm">회원가입</NuxtLink>
          </template>
        </nav>
      </div>
    </header>
    <main class="container">
      <slot />
    </main>
  </div>
</template>
