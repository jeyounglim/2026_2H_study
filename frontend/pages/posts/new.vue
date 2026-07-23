<script setup lang="ts">
import type { Post } from '~/types';
import { getApiErrorMessage } from '~/utils/apiError';

definePageMeta({ middleware: 'auth' });

const api = useApi();
const title = ref('');
const content = ref('');
const thumbnailFile = ref<File | null>(null);
const thumbnailPreview = ref<string | null>(null);
const contentFiles = ref<File[]>([]);
const contentPreviews = ref<string[]>([]);
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

function onContentImagesChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) return;

  const next = [...contentFiles.value, ...files].slice(0, 10);
  contentPreviews.value.forEach((url) => URL.revokeObjectURL(url));
  contentFiles.value = next;
  contentPreviews.value = next.map((file) => URL.createObjectURL(file));
}

function removeContentImage(index: number) {
  URL.revokeObjectURL(contentPreviews.value[index]);
  contentFiles.value = contentFiles.value.filter((_, i) => i !== index);
  contentPreviews.value = contentPreviews.value.filter((_, i) => i !== index);
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
    contentFiles.value.forEach((file) => body.append('images', file));

    const res = await api<{ data: Post }>('/posts', {
      method: 'POST',
      body,
    });
    await navigateTo(`/posts/${res.data.id}`);
  } catch (e: unknown) {
    error.value = getApiErrorMessage(e, '질문 등록에 실패했습니다.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="form-card card">
    <NuxtLink to="/posts" class="back-link">← 질문 목록</NuxtLink>
    <h1 class="title">새 질문</h1>
    <p class="muted" style="margin-top: -8px; margin-bottom: 24px">
      막힌 상황과 시도한 내용을 구체적으로 적어주세요.
    </p>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>질문 제목</label>
        <input
          v-model="title"
          class="input"
          placeholder="예: Nuxt에서 API 401 에러가 납니다"
          required
          maxlength="255"
        />
        <p class="muted" style="margin-top: 6px; font-size: 13px">최대 255자</p>
      </div>

      <div class="field">
        <label>목록 썸네일 <span class="muted">(선택, 1장)</span></label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="input"
          @change="onThumbnailChange"
        />
        <p class="muted" style="margin-top: 6px; font-size: 13px">
          질문 목록 카드에만 보이는 대표 이미지입니다.
        </p>
        <div v-if="thumbnailPreview" class="thumbnail-preview-wrap">
          <img :src="thumbnailPreview" alt="썸네일 미리보기" class="thumbnail-preview" />
          <button type="button" class="btn btn-sm btn-ghost" @click="clearThumbnail">썸네일 제거</button>
        </div>
      </div>

      <div class="field">
        <label>질문 내용</label>
        <textarea
          v-model="content"
          class="textarea"
          placeholder="문제 상황, 재현 방법, 시도해본 내용을 적어주세요"
          required
        />
      </div>

      <div class="field">
        <label>본문 이미지 <span class="muted">(선택, 최대 10장)</span></label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="input"
          multiple
          @change="onContentImagesChange"
        />
        <p class="muted" style="margin-top: 6px; font-size: 13px">
          질문 본문과 함께 보여질 이미지입니다. 여러 장 선택할할 수 있습니다.
        </p>
        <div v-if="contentPreviews.length" class="content-image-grid">
          <div v-for="(preview, index) in contentPreviews" :key="preview" class="content-image-item">
            <img :src="preview" :alt="`본문 이미지 ${index + 1}`" />
            <button type="button" class="btn btn-sm btn-ghost" @click="removeContentImage(index)">
              삭제
            </button>
          </div>
        </div>
      </div>

      <div class="row-between">
        <NuxtLink to="/posts" class="btn btn-ghost">취소</NuxtLink>
        <button class="btn" :disabled="loading">{{ loading ? '등록 중...' : '질문 등록' }}</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>
