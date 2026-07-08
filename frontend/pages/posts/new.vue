<script setup lang="ts">
import type { Post } from '~/types';

definePageMeta({ middleware: 'auth' });

const api = useApi();
const title = ref('');
const content = ref('');
const error = ref('');
const loading = ref(false);

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const res = await api<{ data: Post }>('/posts', {
      method: 'POST',
      body: { title: title.value, content: content.value },
    });
    await navigateTo(`/posts/${res.data.id}`);
  } catch (e: any) {
    error.value = e?.data?.message || '작성에 실패했습니다.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="card">
    <h1 class="title">글쓰기</h1>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>제목</label>
        <input v-model="title" class="input" placeholder="제목" required />
      </div>
      <div class="field">
        <label>내용</label>
        <textarea v-model="content" class="textarea" placeholder="내용" required />
      </div>
      <div class="row-between">
        <NuxtLink to="/posts" class="btn btn-outline btn-sm">취소</NuxtLink>
        <button class="btn" :disabled="loading">{{ loading ? '저장 중...' : '작성' }}</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>
