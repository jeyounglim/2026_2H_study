<script setup lang="ts">
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const nickname = ref('');
const error = ref('');
const loading = ref(false);
const done = ref(false);
const verifyUrl = ref<string | null>(null);

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const res = await auth.register({
      email: email.value,
      password: password.value,
      nickname: nickname.value,
    });
    done.value = true;
    // SMTP 미설정(개발) 시 백엔드가 인증 링크를 응답에 포함 -> 화면에 노출
    verifyUrl.value = res.verifyUrl || null;
  } catch (e: any) {
    error.value = e?.data?.message || '회원가입에 실패했습니다.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="card" style="max-width: 440px; margin: 40px auto">
    <h1 class="title">회원가입</h1>

    <div v-if="done" class="stack">
      <p class="success">회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.</p>
      <div v-if="verifyUrl" class="card" style="background: #f8fafc">
        <p class="muted">개발 환경: 아래 링크로 바로 이메일 인증을 진행할 수 있습니다.</p>
        <NuxtLink :to="verifyUrl.replace('http://localhost:3000', '')" class="btn btn-sm">
          이메일 인증하기
        </NuxtLink>
      </div>
      <NuxtLink to="/login" class="btn btn-outline">로그인 페이지로</NuxtLink>
    </div>

    <form v-else @submit.prevent="onSubmit">
      <div class="field">
        <label>이메일</label>
        <input v-model="email" type="email" class="input" placeholder="you@example.com" required />
      </div>
      <div class="field">
        <label>닉네임</label>
        <input v-model="nickname" type="text" class="input" placeholder="닉네임 (2~20자)" required />
      </div>
      <div class="field">
        <label>비밀번호</label>
        <input v-model="password" type="password" class="input" placeholder="8자 이상" required />
      </div>
      <button class="btn" style="width: 100%" :disabled="loading">
        {{ loading ? '처리 중...' : '회원가입' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>

    <p v-if="!done" class="muted" style="margin-top: 16px; text-align: center">
      이미 계정이 있으신가요? <NuxtLink to="/login" style="color: var(--primary)">로그인</NuxtLink>
    </p>
  </div>
</template>
