<script setup lang="ts">
import type { Paginated, Post } from '~/types';

const route = useRoute();
const router = useRouter();
const api = useApi();

const page = computed(() => Number(route.query.page) || 1);
const search = ref((route.query.search as string) || '');

const { data, pending, refresh } = await useAsyncData(
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
    <div class="row-between" style="margin-bottom: 16px">
      <h1 class="title" style="margin: 0">게시판</h1>
      <form style="display: flex; gap: 8px" @submit.prevent="onSearch">
        <input v-model="search" class="input" placeholder="검색어" style="width: 180px" />
        <button class="btn btn-outline btn-sm" type="submit">검색</button>
      </form>
    </div>

    <div class="card">
      <p v-if="pending" class="muted">불러오는 중...</p>
      <p v-else-if="!data || data.data.length === 0" class="muted">게시글이 없습니다.</p>

      <div v-else>
        <div v-for="post in data.data" :key="post.id" class="post-item">
          <NuxtLink :to="`/posts/${post.id}`">
            <h3>{{ post.title }}</h3>
          </NuxtLink>
          <div class="muted">
            {{ post.author.nickname }} · {{ formatDate(post.createdAt) }} · 댓글
            {{ post._count?.comments ?? 0 }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="data && data.pagination.totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @click="goPage(page - 1)">이전</button>
      <button
        v-for="p in data.pagination.totalPages"
        :key="p"
        :class="{ active: p === page }"
        @click="goPage(p)"
      >
        {{ p }}
      </button>
      <button :disabled="!data.pagination.hasNext" @click="goPage(page + 1)">다음</button>
    </div>
  </div>
</template>
