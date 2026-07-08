<script setup lang="ts">
const route = useRoute();
const api = useApi();

const status = ref<'loading' | 'success' | 'error'>('loading');
const message = ref('');

onMounted(async () => {
  const token = route.query.token as string | undefined;
  if (!token) {
    status.value = 'error';
    message.value = '인증 토큰이 없습니다.';
    return;
  }
  try {
    const res = await api<{ message: string }>('/auth/verify-email', {
      params: { token },
    });
    status.value = 'success';
    message.value = res.message;
  } catch (e: any) {
    status.value = 'error';
    message.value = e?.data?.message || '이메일 인증에 실패했습니다.';
  }
});
</script>

<template>
  <div class="card" style="max-width: 440px; margin: 40px auto; text-align: center">
    <h1 class="title">이메일 인증</h1>
    <p v-if="status === 'loading'" class="muted">인증 처리 중입니다...</p>
    <p v-else-if="status === 'success'" class="success">{{ message }}</p>
    <p v-else class="error">{{ message }}</p>
    <NuxtLink v-if="status !== 'loading'" to="/login" class="btn" style="margin-top: 16px">
      로그인 하러 가기
    </NuxtLink>
  </div>
</template>
