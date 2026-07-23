<script setup lang="ts">
import type { Post, PostImage } from '~/types';
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
const currentImages = ref<PostImage[]>(data.value?.data.images ?? []);
const thumbnailFile = ref<File | null>(null);
const thumbnailPreview = ref<string | null>(null);
const contentFiles = ref<File[]>([]);
const contentPreviews = ref<string[]>([]);
const replaceImages = ref(false);
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
    body.append('replaceImages', replaceImages.value ? 'true' : 'false');
    if (thumbnailFile.value) {
      body.append('thumbnail', thumbnailFile.value);
    }
    contentFiles.value.forEach((file) => body.append('images', file));

    await api(`/posts/${postId.value}`, {
      method: 'PUT',
      body,
    });
    await navigateTo(`/posts/${postId.value}`);
  } catch (e: unknown) {
    error.value = getApiErrorMessage(e, '질문 수정에 실패했습니다.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="form-card card">
    <NuxtLink :to="`/posts/${postId}`" class="back-link">← 질문으로</NuxtLink>
    <h1 class="title">질문 수정</h1>
    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>질문 제목</label>
        <input v-model="title" class="input" required maxlength="255" />
      </div>

      <div class="field">
        <label>목록 썸네일 <span class="muted">(선택, 1장)</span></label>
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
            새 썸네일 취소
          </button>
        </div>
        <p v-else class="muted" style="margin-top: 6px; font-size: 13px">등록된 썸네일이 없습니다.</p>
      </div>

      <div class="field">
        <label>질문 내용</label>
        <textarea v-model="content" class="textarea" required />
      </div>

      <div class="field">
        <label>본문 이미지 <span class="muted">(선택, 최대 10장)</span></label>
        <div v-if="currentImages.length" class="content-image-grid" style="margin-bottom: 12px">
          <div v-for="image in currentImages" :key="image.id" class="content-image-item">
            <img :src="mediaUrl(image.url) || ''" alt="기존 본문 이미지" />
          </div>
        </div>
        <label class="replace-images-option">
          <input v-model="replaceImages" type="checkbox" />
          <span>기존 본문 이미지를 새 이미지로 교체</span>
        </label>
        <p class="muted" style="margin: 6px 0 12px; font-size: 13px">
          체크하지 않으면 기존 이미지에 새 이미지가 추가됩니다.
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="input"
          multiple
          @change="onContentImagesChange"
        />
        <div v-if="contentPreviews.length" class="content-image-grid">
          <div v-for="(preview, index) in contentPreviews" :key="preview" class="content-image-item">
            <img :src="preview" :alt="`새 본문 이미지 ${index + 1}`" />
            <button type="button" class="btn btn-sm btn-ghost" @click="removeContentImage(index)">
              삭제
            </button>
          </div>
        </div>
      </div>

      <div class="row-between">
        <NuxtLink :to="`/posts/${postId}`" class="btn btn-ghost">취소</NuxtLink>
        <button class="btn" :disabled="loading">{{ loading ? '저장 중...' : '저장' }}</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>
