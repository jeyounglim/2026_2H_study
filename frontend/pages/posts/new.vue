<script setup lang="ts">
import type { Post } from '~/types';
import { getApiErrorMessage } from '~/utils/apiError';

definePageMeta({ middleware: 'auth' });

const api = useApi();
const mediaUrl = useMediaUrl();
const title = ref('');
const content = ref('');
const thumbnailFile = ref<File | null>(null);
const thumbnailPreview = ref<string | null>(null);
const error = ref('');
const loading = ref(false);

function onThumbnailChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  thumbnailFile.value = file;
  if (thumbnailPreview.value) {
    URL.revokeObjectURL(thumbnailPreview.value);
    thumbnailPreview.value = null;
  }
  if (file) {
    thumbnailPreview.value = URL.createObjectURL(file);
  }
}

function clearThumbnail() {
  thumbnailFile.value = null;
  if (thumbnailPreview.value) {
    URL.revokeObjectURL(thumbnailPreview.value);
    thumbnailPreview.value = null;
  }
}

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const body = new FormData();
    body.append('title', title.value);
    body.append('content', content.value);
    if (thumbnailFile.value) {
      body.append('thumbnail', thumbnailFile.value);
    }

    const res = await api<{ data: Post }>('/posts', {
      method: 'POST',
      body,
    });
    await navigateTo(`/posts/${res.data.id}`);
  } catch (e: unknown) {
    error.value = getApiErrorMessage(e, '작성에 실패했습니다.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="form-card card">
    <NuxtLink to="/posts" class="back-link">← Newsroom</NuxtLink>
    <h1 class="title">새 게시글</h1>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>제목</label>
        <input
          v-model="title"
          class="input"
          placeholder="제목을 입력하세요"
          required
          maxlength="255"
        />
        <p class="muted" style="margin-top: 6px; font-size: 13px">최대 255자</p>
      </div>
      <div class="field">
        <label>썸네일 <span class="muted">(선택)</span></label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="input"
          @change="onThumbnailChange"
        />
        <p class="muted" style="margin-top: 6px; font-size: 13px">
          이미지를 등록하지 않으면 썸네일 없이 게시됩니다.
        </p>
        <div v-if="thumbnailPreview" class="thumbnail-preview-wrap">
          <img :src="thumbnailPreview" alt="썸네일 미리보기" class="thumbnail-preview" />
          <button type="button" class="btn btn-sm btn-ghost" @click="clearThumbnail">썸네일 제거</button>
        </div>
      </div>
      <div class="field">
        <label>내용</label>
        <textarea v-model="content" class="textarea" placeholder="내용을 입력하세요" required />
      </div>
      <div class="row-between">
        <NuxtLink to="/posts" class="btn btn-ghost">취소</NuxtLink>
        <button class="btn" :disabled="loading">{{ loading ? '저장 중...' : '게시' }}</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>
