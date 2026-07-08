<script setup lang="ts">
import type { Post } from '~/types';

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

// 본인 글이 아니면 상세로 돌려보냄
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
  } catch (e: any) {
    error.value = e?.data?.message || '수정에 실패했습니다.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="card">
    <h1 class="title">글 수정</h1>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>제목</label>
        <input v-model="title" class="input" required />
      </div>
      <div class="field">
        <label>내용</label>
        <textarea v-model="content" class="textarea" required />
      </div>
      <div class="row-between">
        <NuxtLink :to="`/posts/${postId}`" class="btn btn-outline btn-sm">취소</NuxtLink>
        <button class="btn" :disabled="loading">{{ loading ? '저장 중...' : '수정' }}</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>
