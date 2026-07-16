<script setup lang="ts">
import type { Post } from '~/types';
import { getApiErrorMessage } from '~/utils/apiError';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const auth = useAuthStore();
const postId = computed(() => Number(route.params.id));

const { data } = await useAsyncData(`post-edit-${postId.value}`, () =>
  api<{ data: Post }>(`/posts/${postId.value}`),
);

const title = ref(data.value?.data.title ?? '');
const content = ref(data.value?.data.content ?? '');
const error = ref('');
const loading = ref(false);

if (data.value && auth.user?.id !== data.value.data.authorId) {
  await navigateTo(`/posts/${postId.value}`);
}

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await api(`/posts/${postId.value}`, {
      method: 'PUT',
      body: { title: title.value, content: content.value },
    });
    await navigateTo(`/posts/${postId.value}`);
  } catch (e: unknown) {
    error.value = getApiErrorMessage(e, '수정에 실패했습니다.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="form-card card">
    <NuxtLink :to="`/posts/${postId}`" class="back-link">← 게시글로</NuxtLink>
    <h1 class="title">글 수정</h1>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>제목</label>
        <input v-model="title" class="input" required maxlength="255" />
      </div>
      <div class="field">
        <label>내용</label>
        <textarea v-model="content" class="textarea" required />
      </div>
      <div class="row-between">
        <NuxtLink :to="`/posts/${postId}`" class="btn btn-ghost">취소</NuxtLink>
        <button class="btn" :disabled="loading">{{ loading ? '저장 중...' : '저장' }}</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>
