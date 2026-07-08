<script setup lang="ts">
import type { Comment, Post } from '~/types';

const route = useRoute();
const api = useApi();
const auth = useAuthStore();
const postId = computed(() => Number(route.params.id));

const { data: postRes, error } = await useAsyncData(`post-${postId.value}`, () =>
  api<{ data: Post }>(`/posts/${postId.value}`),
);

const { data: commentsRes, refresh: refreshComments } = await useAsyncData(
  `comments-${postId.value}`,
  () => api<{ data: Comment[] }>(`/posts/${postId.value}/comments`),
);

const post = computed(() => postRes.value?.data);
const comments = computed(() => commentsRes.value?.data ?? []);
const isAuthor = computed(() => !!post.value && auth.user?.id === post.value.authorId);

const newComment = ref('');
const commentError = ref('');
const submitting = ref(false);

async function addComment() {
  commentError.value = '';
  submitting.value = true;
  try {
    await api(`/posts/${postId.value}/comments`, {
      method: 'POST',
      body: { content: newComment.value },
    });
    newComment.value = '';
    await refreshComments();
  } catch (e: any) {
    commentError.value = e?.data?.message || '댓글 작성에 실패했습니다.';
  } finally {
    submitting.value = false;
  }
}

async function removeComment(id: number) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  try {
    await api(`/comments/${id}`, { method: 'DELETE' });
    await refreshComments();
  } catch (e: any) {
    alert(e?.data?.message || '댓글 삭제에 실패했습니다.');
  }
}

async function removePost() {
  if (!confirm('게시글을 삭제하시겠습니까?')) return;
  try {
    await api(`/posts/${postId.value}`, { method: 'DELETE' });
    await navigateTo('/posts');
  } catch (e: any) {
    alert(e?.data?.message || '게시글 삭제에 실패했습니다.');
  }
}
</script>

<template>
  <div class="stack">
    <div v-if="error" class="card">
      <p class="error">게시글을 찾을 수 없습니다.</p>
      <NuxtLink to="/posts" class="btn btn-outline btn-sm">목록으로</NuxtLink>
    </div>

    <template v-else-if="post">
      <div class="card">
        <div class="row-between">
          <h1 class="title" style="margin: 0">{{ post.title }}</h1>
          <div v-if="isAuthor" style="display: flex; gap: 8px">
            <NuxtLink :to="`/posts/${post.id}/edit`" class="btn btn-outline btn-sm">수정</NuxtLink>
            <button class="btn btn-danger btn-sm" @click="removePost">삭제</button>
          </div>
        </div>
        <div class="muted" style="margin: 8px 0 16px">
          {{ post.author.nickname }} · {{ formatDate(post.createdAt) }}
        </div>
        <div class="content-body">{{ post.content }}</div>
      </div>

      <div class="card">
        <h2 style="font-size: 17px; margin: 0 0 12px">댓글 {{ comments.length }}</h2>

        <div v-if="auth.isLoggedIn" style="margin-bottom: 16px">
          <textarea
            v-model="newComment"
            class="textarea"
            style="min-height: 70px"
            placeholder="댓글을 입력하세요"
          />
          <div class="row-between" style="margin-top: 8px">
            <span class="error">{{ commentError }}</span>
            <button class="btn btn-sm" :disabled="submitting || !newComment.trim()" @click="addComment">
              댓글 작성
            </button>
          </div>
        </div>
        <p v-else class="muted">
          댓글을 작성하려면 <NuxtLink to="/login" style="color: var(--primary)">로그인</NuxtLink>하세요.
        </p>

        <div v-if="comments.length === 0" class="muted">첫 댓글을 남겨보세요.</div>
        <div v-for="c in comments" :key="c.id" class="comment">
          <div class="row-between">
            <span style="font-weight: 600; font-size: 14px">{{ c.author.nickname }}</span>
            <button
              v-if="auth.user?.id === c.authorId"
              class="btn btn-danger btn-sm"
              @click="removeComment(c.id)"
            >
              삭제
            </button>
          </div>
          <div class="content-body" style="margin: 4px 0">{{ c.content }}</div>
          <div class="muted">{{ formatDate(c.createdAt) }}</div>
        </div>
      </div>

      <NuxtLink to="/posts" class="btn btn-outline btn-sm" style="align-self: flex-start">
        목록으로
      </NuxtLink>
    </template>
  </div>
</template>
