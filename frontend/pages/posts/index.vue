<script setup lang="ts">
import type { Paginated, Post } from '~/types';

const route = useRoute();
const router = useRouter();
const api = useApi();
const auth = useAuthStore();

const page = computed(() => Number(route.query.page) || 1);
const search = ref((route.query.search as string) || '');

const { data, pending } = await useAsyncData(
  'posts',
  () =>
    api<Paginated<Post>>('/posts', {
      params: { page: page.value, limit: 10, search: (route.query.search as string) || '' },
    }),
  { watch: [page, () => route.query.search] },
);

function goPage(p: number) {
  router.push({ query: { ...route.query, page: p } });
}

function onSearch() {
  router.push({ query: { search: search.value || undefined, page: 1 } });
}

function goWrite() {
  navigateTo('/posts/new');
}
</script>

<template>
  <div>
    <header class="hero">
      <p class="hero-eyebrow">Board</p>
      <h1 class="hero-title">Study</h1>
      <p class="hero-subtitle">
        최신 게시글과 업데이트를 확인하세요.
      </p>
    </header>

    <div v-if="auth.isLoggedIn" class="compose-bar">
      <UserAvatar
        :email="auth.user?.email"
        :nickname="auth.user?.nickname"
        :profile-image="auth.user?.profileImage"
      />
      <button type="button" class="compose-prompt" @click="goWrite">
        어떤 작업을 하고 있나요?
      </button>
      <button type="button" class="btn compose-write-btn" @click="goWrite">글쓰기</button>
    </div>

    <div class="section-header">
      <h2 class="section-title">최근 게시글</h2>
      <form class="search-form" @submit.prevent="onSearch">
        <input v-model="search" class="search-input" placeholder="검색" />
        <button class="btn btn-sm btn-outline" type="submit">검색</button>
      </form>
    </div>

    <p v-if="pending" class="loading-state">불러오는 중...</p>
    <p v-else-if="!data || data.data.length === 0" class="empty-state">게시글이 없습니다.</p>

    <ul v-else class="feed-list">
      <li v-for="post in data.data" :key="post.id" class="feed-card">
        <NuxtLink :to="`/posts/${post.id}`" class="feed-card-link">
          <div class="feed-card-header">
            <UserAvatar
              size="sm"
              :nickname="post.author.nickname"
              :profile-image="post.author.profileImage"
            />
            <span class="feed-author">{{ post.author.nickname }}</span>
          </div>
          <h3 class="feed-title">{{ post.title }}</h3>
          <p class="feed-excerpt">{{ excerptText(post.content) }}</p>
          <div class="feed-footer">
            <span class="feed-stat" title="댓글">
              <svg class="feed-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M7 18.5 4.5 21V7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 17 18H7z"
                />
              </svg>
              {{ post._count?.comments ?? 0 }}
            </span>
            <span class="feed-stat" :title="formatDate(post.createdAt)">
              <svg class="feed-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8" />
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  d="M12 8v4.5l3 1.5"
                />
              </svg>
              {{ formatRelativeTime(post.createdAt) }}
            </span>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <div v-if="data && data.pagination.totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @click="goPage(page - 1)">‹</button>
      <button
        v-for="p in data.pagination.totalPages"
        :key="p"
        :class="{ active: p === page }"
        @click="goPage(p)"
      >
        {{ p }}
      </button>
      <button :disabled="!data.pagination.hasNext" @click="goPage(page + 1)">›</button>
    </div>
  </div>
</template>
