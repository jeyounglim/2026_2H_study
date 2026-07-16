<script setup lang="ts">
import type { Paginated, Post } from '~/types';

const route = useRoute();
const router = useRouter();
const api = useApi();
const auth = useAuthStore();
const mediaUrl = useMediaUrl();

const page = computed(() => Number(route.query.page) || 1);
const search = ref((route.query.search as string) || '');

const { data: popularRes, pending: popularPending } = await useAsyncData(
  'popular-posts',
  () => api<{ data: Post[] }>('/posts/popular', { params: { limit: 5 } }),
);

const { data, pending } = await useAsyncData(
  'posts',
  () =>
    api<Paginated<Post>>('/posts', {
      params: { page: page.value, limit: 10, search: (route.query.search as string) || '' },
    }),
  { watch: [page, () => route.query.search] },
);

const popularPosts = computed(() => popularRes.value?.data ?? []);
const recentPosts = computed(() => data.value?.data ?? []);
const postsWithThumbnail = computed(() => recentPosts.value.filter((post) => post.thumbnail));
const postsWithoutThumbnail = computed(() => recentPosts.value.filter((post) => !post.thumbnail));
const featuredPost = computed(() => postsWithThumbnail.value[0] ?? null);
const gridPosts = computed(() => postsWithThumbnail.value.slice(1));

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
        인기 게시글과 최신 업데이트를 확인하세요.
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

    <section class="board-section">
      <div class="board-section-header">
        <h2 class="board-section-title">인기 게시글</h2>
        <p class="board-section-desc">댓글이 많은 게시글 순위입니다.</p>
      </div>

      <p v-if="popularPending" class="loading-state">불러오는 중...</p>
      <p v-else-if="popularPosts.length === 0" class="empty-state">인기 게시글이 없습니다.</p>

      <ol v-else class="popular-list">
        <li v-for="(post, index) in popularPosts" :key="post.id" class="popular-item">
          <NuxtLink :to="`/posts/${post.id}`" class="popular-link">
            <span class="popular-rank">#{{ index + 1 }}</span>
            <div class="popular-body">
              <div class="popular-meta">
                <UserAvatar
                  size="sm"
                  :nickname="post.author.nickname"
                  :profile-image="post.author.profileImage"
                />
                <span class="popular-author">{{ post.author.nickname }}</span>
              </div>
              <h3 class="popular-title">{{ post.title }}</h3>
            </div>
            <span class="popular-vote" title="댓글 수">
              <svg class="popular-vote-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 5v14M5 12l7-7 7 7"
                />
              </svg>
              {{ post._count?.comments ?? 0 }}
            </span>
          </NuxtLink>
        </li>
      </ol>
    </section>

    <section class="board-section">
      <div class="section-header">
        <div>
          <h2 class="board-section-title">최근 게시글</h2>
          <p class="board-section-desc">최신순으로 정렬된 게시글입니다.</p>
        </div>
        <form class="search-form" @submit.prevent="onSearch">
          <input v-model="search" class="search-input" placeholder="검색" />
          <button class="btn btn-sm btn-outline" type="submit">검색</button>
        </form>
      </div>

      <p v-if="pending" class="loading-state">불러오는 중...</p>
      <p v-else-if="recentPosts.length === 0" class="empty-state">게시글이 없습니다.</p>

      <template v-else>
        <div v-if="postsWithThumbnail.length" class="magazine-section">
          <article v-if="featuredPost" class="magazine-featured">
            <NuxtLink :to="`/posts/${featuredPost.id}`" class="magazine-featured-link">
              <img
                :src="mediaUrl(featuredPost.thumbnail)"
                :alt="featuredPost.title"
                class="magazine-featured-image"
              />
              <div class="magazine-featured-body">
                <h3 class="magazine-featured-title">{{ featuredPost.title }}</h3>
                <p class="magazine-featured-excerpt">{{ excerptText(featuredPost.content) }}</p>
                <div class="magazine-card-meta">
                  <span>{{ formatRelativeTime(featuredPost.createdAt) }}</span>
                  <span>@{{ featuredPost.author.nickname }}</span>
                  <span>댓글 {{ featuredPost._count?.comments ?? 0 }}</span>
                </div>
              </div>
            </NuxtLink>
          </article>

          <div v-if="gridPosts.length" class="magazine-grid">
            <article v-for="post in gridPosts" :key="post.id" class="magazine-card">
              <NuxtLink :to="`/posts/${post.id}`" class="magazine-card-link">
                <img :src="mediaUrl(post.thumbnail)" :alt="post.title" class="magazine-card-image" />
                <div class="magazine-card-body">
                  <h3 class="magazine-card-title">{{ post.title }}</h3>
                  <p class="magazine-card-excerpt">{{ excerptText(post.content) }}</p>
                  <div class="magazine-card-meta">
                    <span>{{ formatRelativeTime(post.createdAt) }}</span>
                    <span>@{{ post.author.nickname }}</span>
                  </div>
                </div>
              </NuxtLink>
            </article>
          </div>
        </div>

        <ul v-if="postsWithoutThumbnail.length" class="recent-list">
          <li v-for="post in postsWithoutThumbnail" :key="post.id" class="recent-item">
            <NuxtLink :to="`/posts/${post.id}`" class="recent-link">
              <div class="recent-main">
                <h3 class="recent-title">{{ post.title }}</h3>
                <div class="recent-meta">
                  <svg class="recent-meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.8" />
                    <path
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      d="M12 8v4.5l3 1.5"
                    />
                  </svg>
                  <span>{{ formatRelativeTime(post.createdAt) }}</span>
                  <span class="recent-author">@{{ post.author.nickname }}</span>
                </div>
              </div>
              <UserAvatar
                size="sm"
                class="recent-avatar"
                :nickname="post.author.nickname"
                :profile-image="post.author.profileImage"
              />
            </NuxtLink>
          </li>
        </ul>
      </template>

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
    </section>
  </div>
</template>
