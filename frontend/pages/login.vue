<script setup lang="ts">
const auth = useAuthStore();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    const redirect = (route.query.redirect as string) || '/posts';
    await navigateTo(redirect);
  } catch (e: any) {
    error.value = e?.data?.message || '로그인에 실패했습니다.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-card card">
    <h1 class="title" style="text-align: center; margin-bottom: 8px">로그인</h1>
    <p class="muted" style="text-align: center; margin-bottom: 32px">계정에 로그인하세요.</p>

    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>이메일</label>
        <input v-model="email" type="email" class="input" placeholder="you@example.com" required />
      </div>
      <div class="field">
        <label>비밀번호</label>
        <input v-model="password" type="password" class="input" placeholder="비밀번호" required />
      </div>
      <button class="btn" style="width: 100%" :disabled="loading">
        {{ loading ? '로그인 중...' : '로그인' }}
      </button>
      <p v-if="error" class="error" style="text-align: center">{{ error }}</p>
    </form>

    <p class="muted" style="margin-top: 24px; text-align: center">
      계정이 없으신가요?
      <NuxtLink to="/register" class="text-link">회원가입</NuxtLink>
    </p>
  </div>
</template>
