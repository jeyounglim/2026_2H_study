<script setup lang="ts">
import type { Comment, Post } from '~/types';

const route = useRoute();
const api = useApi();
const auth = useAuthStore();
const mediaUrl = useMediaUrl();
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
const commentCount = computed(() =>
  comments.value.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0),
);
const isAuthor = computed(() => !!post.value && auth.user?.id === post.value.authorId);

const newComment = ref('');
const commentError = ref('');
const submitting = ref(false);
const editingCommentId = ref<number | null>(null);
const editingContent = ref('');
const replyToId = ref<number | null>(null);
const replyContent = ref('');
const replyError = ref('');
const replySubmitting = ref(false);

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
    commentError.value = e?.data?.message || '답변 작성에 실패했습니다.';
  } finally {
    submitting.value = false;
  }
}

function startReply(commentId: number) {
  replyToId.value = commentId;
  replyContent.value = '';
  replyError.value = '';
  cancelEditComment();
}

function cancelReply() {
  replyToId.value = null;
  replyContent.value = '';
  replyError.value = '';
}

async function submitReply() {
  if (replyToId.value == null || !replyContent.value.trim()) return;
  replyError.value = '';
  replySubmitting.value = true;
  try {
    await api(`/posts/${postId.value}/comments`, {
      method: 'POST',
      body: { content: replyContent.value, parentId: replyToId.value },
    });
    cancelReply();
    await refreshComments();
  } catch (e: any) {
    replyError.value = e?.data?.message || '추가 의견 작성에 실패했습니다.';
  } finally {
    replySubmitting.value = false;
  }
}

async function removeComment(comment: Comment) {
  const hasReplies = (comment.replies?.length ?? 0) > 0;
  const msg = hasReplies
    ? '이 답변과 추가 의견이 함께 삭제됩니다. 계속할까요?'
    : '답변을 삭제하시겠습니까?';
  if (!confirm(msg)) return;
  try {
    await api(`/comments/${comment.id}`, { method: 'DELETE' });
    if (editingCommentId.value === comment.id) cancelEditComment();
    if (replyToId.value === comment.id) cancelReply();
    await refreshComments();
  } catch (e: any) {
    alert(e?.data?.message || '답변 삭제에 실패했습니다.');
  }
}

function startEditComment(comment: Comment) {
  editingCommentId.value = comment.id;
  editingContent.value = comment.content;
  cancelReply();
}

function cancelEditComment() {
  editingCommentId.value = null;
  editingContent.value = '';
}

async function saveEditComment(id: number) {
  if (!editingContent.value.trim()) return;
  try {
    await api(`/comments/${id}`, {
      method: 'PUT',
      body: { content: editingContent.value },
    });
    cancelEditComment();
    await refreshComments();
  } catch (e: any) {
    alert(e?.data?.message || '답변 수정에 실패했습니다.');
  }
}

async function removePost() {
  if (!confirm('질문을 삭제하시겠습니까?')) return;
  try {
    await api(`/posts/${postId.value}`, { method: 'DELETE' });
    await navigateTo('/posts');
  } catch (e: any) {
    alert(e?.data?.message || '질문 삭제에 실패했습니다.');
  }
}

const likingIds = ref<Set<number>>(new Set());

function patchCommentLike(list: Comment[], commentId: number, liked: boolean, likeCount: number) {
  for (const item of list) {
    if (item.id === commentId) {
      item.likedByMe = liked;
      item.likeCount = likeCount;
      return true;
    }
    if (item.replies?.length && patchCommentLike(item.replies, commentId, liked, likeCount)) {
      return true;
    }
  }
  return false;
}

async function toggleCommentLike(comment: Comment) {
  if (!auth.isLoggedIn) {
    await navigateTo('/login');
    return;
  }
  if (likingIds.value.has(comment.id)) return;

  likingIds.value = new Set(likingIds.value).add(comment.id);
  try {
    const res = await api<{ data: { liked: boolean; likeCount: number } }>(
      `/comments/${comment.id}/like`,
      { method: 'POST' },
    );
    const list = commentsRes.value?.data;
    if (list) {
      patchCommentLike(list, comment.id, res.data.liked, res.data.likeCount);
    }
  } catch (e: any) {
    alert(e?.data?.message || '추천에 실패했습니다.');
  } finally {
    const next = new Set(likingIds.value);
    next.delete(comment.id);
    likingIds.value = next;
  }
}
</script>

<template>
  <div>
    <NuxtLink to="/posts" class="back-link">← 질문 목록</NuxtLink>

    <div v-if="error" class="empty-state">
      <p>질문을 찾을 수 없습니다.</p>
      <NuxtLink to="/posts" class="btn btn-outline btn-sm" style="margin-top: 16px">목록으로</NuxtLink>
    </div>

    <template v-else-if="post">
      <article class="article-detail">
        <img
          v-if="post.thumbnail"
          :src="mediaUrl(post.thumbnail) || ''"
          :alt="post.title"
          class="article-detail-thumbnail"
        />
        <header class="article-detail-header">
          <p class="hero-eyebrow" style="margin-bottom: 12px">Question</p>
          <h1 class="article-detail-title">{{ post.title }}</h1>
          <div class="article-detail-meta">
            <span class="name-with-flag">
              <RoleFlag :level="post.author.level" />
              {{ post.author.nickname }}
            </span>
            · {{ formatDate(post.createdAt) }}
          </div>
          <div v-if="isAuthor" class="article-actions">
            <NuxtLink :to="`/posts/${post.id}/edit`" class="btn btn-sm btn-outline">수정</NuxtLink>
            <button class="btn btn-sm btn-danger" @click="removePost">삭제</button>
          </div>
        </header>
        <div class="article-detail-body">{{ post.content }}</div>
        <div v-if="post.images?.length" class="article-content-images">
          <img
            v-for="image in post.images"
            :key="image.id"
            :src="mediaUrl(image.url) || ''"
            :alt="`${post.title} 본문 이미지`"
            class="article-content-image"
          />
        </div>
      </article>

      <section class="comments-section">
        <h2 class="comments-heading">답변 {{ commentCount }}</h2>

        <div v-if="auth.isLoggedIn" style="margin-bottom: 24px">
          <textarea
            v-model="newComment"
            class="textarea"
            style="min-height: 80px"
            placeholder="해결 방법이나 힌트를 답변으로 남겨주세요"
          />
          <div class="row-between" style="margin-top: 12px">
            <span class="error">{{ commentError }}</span>
            <button class="btn btn-sm" :disabled="submitting || !newComment.trim()" @click="addComment">
              답변 작성
            </button>
          </div>
        </div>
        <p v-else class="muted">
          답변을 작성하려면 <NuxtLink to="/login" class="text-link">로그인</NuxtLink>하세요.
        </p>

        <p v-if="comments.length === 0" class="muted" style="padding: 24px 0">
          아직 답변이 없습니다. 첫 답변을 남겨보세요.
        </p>

        <div v-for="c in comments" :key="c.id" class="comment">
          <div class="row-between">
            <span class="comment-author name-with-flag">
              <RoleFlag :level="c.author.level" />
              {{ c.author.nickname }}
            </span>
            <div class="comment-actions">
              <button
                v-if="auth.isLoggedIn && editingCommentId !== c.id"
                class="btn btn-sm btn-ghost"
                @click="startReply(c.id)"
              >
                의견
              </button>
              <template v-if="auth.user?.id === c.authorId">
                <button
                  v-if="editingCommentId !== c.id"
                  class="btn btn-sm btn-ghost"
                  @click="startEditComment(c)"
                >
                  수정
                </button>
                <button class="btn btn-sm btn-danger" @click="removeComment(c)">삭제</button>
              </template>
            </div>
          </div>
          <div v-if="editingCommentId === c.id" style="margin-top: 12px">
            <textarea v-model="editingContent" class="textarea" style="min-height: 60px" />
            <div style="display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end">
              <button class="btn btn-sm btn-ghost" @click="cancelEditComment">취소</button>
              <button class="btn btn-sm" :disabled="!editingContent.trim()" @click="saveEditComment(c.id)">
                저장
              </button>
            </div>
          </div>
          <template v-else>
            <div class="comment-body">{{ c.content }}</div>
            <div class="comment-meta">
              <span class="comment-date">{{ formatDate(c.createdAt) }}</span>
              <button
                type="button"
                class="comment-like"
                :class="{ 'is-liked': c.likedByMe }"
                :disabled="likingIds.has(c.id)"
                :aria-pressed="!!c.likedByMe"
                @click="toggleCommentLike(c)"
              >
                추천 {{ c.likeCount ?? 0 }}
              </button>
            </div>
          </template>

          <div v-if="replyToId === c.id" class="reply-form">
            <textarea
              v-model="replyContent"
              class="textarea"
              style="min-height: 60px"
              :placeholder="`${c.author.nickname}님 답변에 의견 남기기`"
            />
            <div class="row-between" style="margin-top: 8px">
              <span class="error">{{ replyError }}</span>
              <div style="display: flex; gap: 8px">
                <button class="btn btn-sm btn-ghost" @click="cancelReply">취소</button>
                <button
                  class="btn btn-sm"
                  :disabled="replySubmitting || !replyContent.trim()"
                  @click="submitReply"
                >
                  의견 작성
                </button>
              </div>
            </div>
          </div>

          <div v-if="c.replies?.length" class="comment-replies">
            <div v-for="r in c.replies" :key="r.id" class="comment comment-reply">
              <div class="row-between">
                <span class="comment-author name-with-flag">
                  <RoleFlag :level="r.author.level" />
                  {{ r.author.nickname }}
                </span>
                <div v-if="auth.user?.id === r.authorId" class="comment-actions">
                  <button
                    v-if="editingCommentId !== r.id"
                    class="btn btn-sm btn-ghost"
                    @click="startEditComment(r)"
                  >
                    수정
                  </button>
                  <button class="btn btn-sm btn-danger" @click="removeComment(r)">삭제</button>
                </div>
              </div>
              <div v-if="editingCommentId === r.id" style="margin-top: 12px">
                <textarea v-model="editingContent" class="textarea" style="min-height: 60px" />
                <div style="display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end">
                  <button class="btn btn-sm btn-ghost" @click="cancelEditComment">취소</button>
                  <button
                    class="btn btn-sm"
                    :disabled="!editingContent.trim()"
                    @click="saveEditComment(r.id)"
                  >
                    저장
                  </button>
                </div>
              </div>
              <template v-else>
                <div class="comment-body">{{ r.content }}</div>
                <div class="comment-meta">
                  <span class="comment-date">{{ formatDate(r.createdAt) }}</span>
                  <button
                    type="button"
                    class="comment-like"
                    :class="{ 'is-liked': r.likedByMe }"
                    :disabled="likingIds.has(r.id)"
                    :aria-pressed="!!r.likedByMe"
                    @click="toggleCommentLike(r)"
                  >
                    추천 {{ r.likeCount ?? 0 }}
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
