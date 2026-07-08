<script setup lang="ts">
import type { Paginated, Post } from '~/types';

const route = useRoute();
const router = useRouter();
const api = useApi();

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
</script>

<template>
  <div>
    <header class="hero">
      <p class="hero-eyebrow">Board</p>
      <h1 class="hero-title">Newsroom</h1>
      <p class="hero-subtitle">
        최신 게시글과 업데이트를 확인하세요.
      </p>
    </header>

    <div class="section-header">
      <h2 class="section-title">최근 게시글</h2>
      <form class="search-form" @submit.prevent="onSearch">
        <input v-model="search" class="search-input" placeholder="검색" />
        <button class="btn btn-sm btn-outline" type="submit">검색</button>
      </form>
    </div>

    <p v-if="pending" class="loading-state">불러오는 중...</p>
    <p v-else-if="!data || data.data.length === 0" class="empty-state">게시글이 없습니다.</p>

    <ul v-else class="article-list">
      <li v-for="post in data.data" :key="post.id" class="article-item">
        <NuxtLink :to="`/posts/${post.id}`" class="article-link">
          <h3 class="article-title">{{ post.title }}</h3>
          <div class="article-meta">
            <span>{{ post.author.nickname }}</span>
            <span>{{ formatDate(post.createdAt) }}</span>
            <span>댓글 {{ post._count?.comments ?? 0 }}</span>
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
