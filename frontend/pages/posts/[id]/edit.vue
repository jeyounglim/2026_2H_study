<script setup lang="ts">
import type { Post } from '~/types';
import { getApiErrorMessage } from '~/utils/apiError';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const api = useApi();
const mediaUrl = useMediaUrl();
const auth = useAuthStore();
const postId = computed(() => Number(route.params.id));

const { data } = await useAsyncData(`post-edit-${postId.value}`, () =>
  api<{ data: Post }>(`/posts/${postId.value}`),
);

const title = ref(data.value?.data.title ?? '');
const content = ref(data.value?.data.content ?? '');
const currentThumbnail = ref(data.value?.data.thumbnail ?? null);
const thumbnailFile = ref<File | null>(null);
const thumbnailPreview = ref<string | null>(null);
const error = ref('');
const loading = ref(false);

if (data.value && auth.user?.id !== data.value.data.authorId) {
  await navigateTo(`/posts/${postId.value}`);
}

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

function clearNewThumbnail() {
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

    await api(`/posts/${postId.value}`, {
      method: 'PUT',
      body,
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
        <label>썸네일 <span class="muted">(선택)</span></label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="input"
          @change="onThumbnailChange"
        />
        <div v-if="thumbnailPreview || currentThumbnail" class="thumbnail-preview-wrap">
          <img
            :src="thumbnailPreview || mediaUrl(currentThumbnail)"
            alt="썸네일 미리보기"
            class="thumbnail-preview"
          />
          <button
            v-if="thumbnailPreview"
            type="button"
            class="btn btn-sm btn-ghost"
            @click="clearNewThumbnail"
          >
            새 이미지 취소
          </button>
        </div>
        <p v-else class="muted" style="margin-top: 6px; font-size: 13px">
          등록된 썸네일이 없습니다.
        </p>
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
