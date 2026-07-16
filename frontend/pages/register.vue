<script setup lang="ts">
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const nickname = ref('');
const error = ref('');
const loading = ref(false);
const done = ref(false);
const verifyUrl = ref<string | null>(null);

const verifyPath = computed(() => {
  if (!verifyUrl.value) return null;
  try {
    const u = new URL(verifyUrl.value);
    return u.pathname + u.search;
  } catch {
    return verifyUrl.value.replace(/^https?:\/\/[^/]+/, '');
  }
});

function getRegisterErrorMessage(e: unknown): string {
  const data = (e as { data?: { message?: string; errors?: { message?: string }[] } })?.data;
  const fieldMessages = data?.errors
    ?.map((err) => err.message)
    .filter((msg): msg is string => !!msg);
  if (fieldMessages?.length) {
    return fieldMessages.join(' ');
  }
  return data?.message || '회원가입에 실패했습니다.';
}

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
    verifyUrl.value = res.verifyUrl || null;
  } catch (e: unknown) {
    error.value = getRegisterErrorMessage(e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-card card">
    <h1 class="title" style="text-align: center; margin-bottom: 8px">회원가입</h1>
    <p class="muted" style="text-align: center; margin-bottom: 32px">새 계정을 만드세요.</p>

    <div v-if="done" class="stack">
      <p class="success" style="text-align: center">회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.</p>
      <div v-if="verifyPath" class="card-subtle">
        <p class="muted">개발 환경: 아래 버튼으로 바로 이메일 인증을 진행할 수 있습니다.</p>
        <NuxtLink :to="verifyPath" class="btn btn-sm" style="margin-top: 12px">이메일 인증하기</NuxtLink>
      </div>
      <NuxtLink to="/login" class="btn btn-outline" style="text-align: center">로그인 페이지로</NuxtLink>
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
      <p v-if="error" class="error" style="text-align: center">{{ error }}</p>
    </form>

    <p v-if="!done" class="muted" style="margin-top: 24px; text-align: center">
      이미 계정이 있으신가요?
      <NuxtLink to="/login" class="text-link">로그인</NuxtLink>
    </p>
  </div>
</template>
