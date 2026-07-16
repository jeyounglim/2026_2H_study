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
    commentError.value = e?.data?.message || '댓글 작성에 실패했습니다.';
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
    replyError.value = e?.data?.message || '답글 작성에 실패했습니다.';
  } finally {
    replySubmitting.value = false;
  }
}

async function removeComment(comment: Comment) {
  const hasReplies = (comment.replies?.length ?? 0) > 0;
  const msg = hasReplies
    ? '이 댓글과 답글이 함께 삭제됩니다. 계속할까요?'
    : '댓글을 삭제하시겠습니까?';
  if (!confirm(msg)) return;
  try {
    await api(`/comments/${comment.id}`, { method: 'DELETE' });
    if (editingCommentId.value === comment.id) cancelEditComment();
    if (replyToId.value === comment.id) cancelReply();
    await refreshComments();
  } catch (e: any) {
    alert(e?.data?.message || '댓글 삭제에 실패했습니다.');
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
    alert(e?.data?.message || '댓글 수정에 실패했습니다.');
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
  <div>
    <NuxtLink to="/posts" class="back-link">← Newsroom</NuxtLink>

    <div v-if="error" class="empty-state">
      <p>게시글을 찾을 수 없습니다.</p>
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
          <h1 class="article-detail-title">{{ post.title }}</h1>
          <div class="article-detail-meta">
            {{ post.author.nickname }} · {{ formatDate(post.createdAt) }}
          </div>
          <div v-if="isAuthor" class="article-actions">
            <NuxtLink :to="`/posts/${post.id}/edit`" class="btn btn-sm btn-outline">수정</NuxtLink>
            <button class="btn btn-sm btn-danger" @click="removePost">삭제</button>
          </div>
        </header>
        <div class="article-detail-body">{{ post.content }}</div>
      </article>

      <section class="comments-section">
        <h2 class="comments-heading">댓글 {{ commentCount }}</h2>

        <div v-if="auth.isLoggedIn" style="margin-bottom: 24px">
          <textarea
            v-model="newComment"
            class="textarea"
            style="min-height: 80px"
            placeholder="댓글을 입력하세요"
          />
          <div class="row-between" style="margin-top: 12px">
            <span class="error">{{ commentError }}</span>
            <button class="btn btn-sm" :disabled="submitting || !newComment.trim()" @click="addComment">
              댓글 작성
            </button>
          </div>
        </div>
        <p v-else class="muted">
          댓글을 작성하려면 <NuxtLink to="/login" class="text-link">로그인</NuxtLink>하세요.
        </p>

        <p v-if="comments.length === 0" class="muted" style="padding: 24px 0">첫 댓글을 남겨보세요.</p>

        <div v-for="c in comments" :key="c.id" class="comment">
          <div class="row-between">
            <span class="comment-author">{{ c.author.nickname }}</span>
            <div class="comment-actions">
              <button
                v-if="auth.isLoggedIn && editingCommentId !== c.id"
                class="btn btn-sm btn-ghost"
                @click="startReply(c.id)"
              >
                답글
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
            <div class="comment-date">{{ formatDate(c.createdAt) }}</div>
          </template>

          <div v-if="replyToId === c.id" class="reply-form">
            <textarea
              v-model="replyContent"
              class="textarea"
              style="min-height: 60px"
              :placeholder="`${c.author.nickname}님에게 답글`"
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
                  답글 작성
                </button>
              </div>
            </div>
          </div>

          <div v-if="c.replies?.length" class="comment-replies">
            <div v-for="r in c.replies" :key="r.id" class="comment comment-reply">
              <div class="row-between">
                <span class="comment-author">{{ r.author.nickname }}</span>
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
                <div class="comment-date">{{ formatDate(r.createdAt) }}</div>
              </template>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
