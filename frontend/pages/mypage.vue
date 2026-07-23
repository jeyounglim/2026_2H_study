<script setup lang="ts">
import type { Paginated, Post, UserLevel } from '~/types';

definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const api = useApi();

const nickname = ref(auth.user?.nickname || '');
const level = ref<UserLevel>((auth.user?.level as UserLevel) || 'JUNIOR');
const profileError = ref('');
const profileSuccess = ref('');
const profileLoading = ref(false);
const avatarError = ref('');

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const passwordError = ref('');
const passwordSuccess = ref('');
const passwordLoading = ref(false);

watch(
  () => auth.user,
  (value) => {
    if (value?.nickname) nickname.value = value.nickname;
    if (value?.level === 'SENIOR' || value?.level === 'JUNIOR') level.value = value.level;
  },
);

const { data: myPostsRes, pending: postsPending } = await useAsyncData(
  'my-posts',
  () => {
    if (!auth.user?.id) return Promise.resolve(null);
    return api<Paginated<Post>>('/posts', {
      params: { authorId: auth.user.id, limit: 5, page: 1 },
    });
  },
  { watch: [() => auth.user?.id] },
);

const myPosts = computed(() => myPostsRes.value?.data ?? []);

async function saveProfile() {
  profileError.value = '';
  profileSuccess.value = '';
  profileLoading.value = true;
  try {
    await auth.updateProfile(nickname.value.trim(), level.value);
    profileSuccess.value = '프로필이 저장되었습니다.';
  } catch (e: any) {
    const fieldMsg = e?.data?.errors?.map((err: { message: string }) => err.message).join(' ');
    profileError.value = fieldMsg || e?.data?.message || '프로필 저장에 실패했습니다.';
  } finally {
    profileLoading.value = false;
  }
}

async function savePassword() {
  passwordError.value = '';
  passwordSuccess.value = '';

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = '새 비밀번호 확인이 일치하지 않습니다.';
    return;
  }

  passwordLoading.value = true;
  try {
    const res = await auth.changePassword(currentPassword.value, newPassword.value);
    passwordSuccess.value = res.message || '비밀번호가 변경되었습니다.';
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (e: any) {
    const fieldMsg = e?.data?.errors?.map((err: { message: string }) => err.message).join(' ');
    passwordError.value = fieldMsg || e?.data?.message || '비밀번호 변경에 실패했습니다.';
  } finally {
    passwordLoading.value = false;
  }
}

function onAvatarError(message: string) {
  avatarError.value = message;
}

function onAvatarUploaded() {
  avatarError.value = '';
}
</script>

<template>
  <div class="mypage">
    <NuxtLink to="/posts" class="back-link">← 질문 목록</NuxtLink>
    <h1 class="title">마이페이지</h1>
    <p class="muted" style="margin-top: -8px; margin-bottom: 28px">
      Code-Q&amp;A 프로필과 계정 정보를 관리하세요.
    </p>

    <section class="mypage-card card">
      <div class="mypage-profile">
        <UserAvatar
          size="lg"
          editable
          :email="auth.user?.email"
          :nickname="auth.user?.nickname"
          :profile-image="auth.user?.profileImage"
          @uploaded="onAvatarUploaded"
          @error="onAvatarError"
        />
        <div class="mypage-profile-meta">
          <p class="mypage-name">
            <RoleFlag :level="auth.user?.level" />
            {{ auth.user?.nickname }}
          </p>
          <p class="muted">{{ auth.user?.email }}</p>
          <p class="muted" style="margin-top: 4px">
            가입일 {{ auth.user?.createdAt ? formatDate(auth.user.createdAt) : '-' }}
          </p>
          <p class="muted" style="margin-top: 8px; font-size: 13px">
            카메라 아이콘을 눌러 프로필 이미지를 변경할 수 있습니다.
          </p>
          <p v-if="avatarError" class="error" style="margin-top: 8px">{{ avatarError }}</p>
        </div>
      </div>
    </section>

    <section class="mypage-card card">
      <h2 class="mypage-section-title">프로필 수정</h2>
      <form @submit.prevent="saveProfile">
        <div class="field">
          <label>이메일</label>
          <input class="input" :value="auth.user?.email" disabled />
        </div>
        <div class="field">
          <label>닉네임</label>
          <input
            v-model="nickname"
            class="input"
            placeholder="닉네임 (2~20자)"
            required
            minlength="2"
            maxlength="20"
          />
        </div>
        <div class="field">
          <label>구분</label>
          <div class="level-options">
            <label class="level-option" :class="{ active: level === 'JUNIOR' }">
              <input v-model="level" type="radio" value="JUNIOR" required />
              <span class="level-option-title">주니어</span>
              <span class="muted">질문하며 성장하는 개발자</span>
            </label>
            <label class="level-option" :class="{ active: level === 'SENIOR' }">
              <input v-model="level" type="radio" value="SENIOR" required />
              <span class="level-option-title">시니어</span>
              <span class="muted">답변으로 도움을 주는 개발자</span>
            </label>
          </div>
        </div>
        <div class="row-between">
          <span class="success">{{ profileSuccess }}</span>
          <button class="btn btn-sm" :disabled="profileLoading || !nickname.trim()">
            {{ profileLoading ? '저장 중...' : '저장' }}
          </button>
        </div>
        <p v-if="profileError" class="error">{{ profileError }}</p>
      </form>
    </section>

    <section class="mypage-card card">
      <h2 class="mypage-section-title">비밀번호 변경</h2>
      <form @submit.prevent="savePassword">
        <div class="field">
          <label>현재 비밀번호</label>
          <input v-model="currentPassword" type="password" class="input" required />
        </div>
        <div class="field">
          <label>새 비밀번호</label>
          <input
            v-model="newPassword"
            type="password"
            class="input"
            placeholder="8자 이상"
            required
            minlength="8"
          />
        </div>
        <div class="field">
          <label>새 비밀번호 확인</label>
          <input v-model="confirmPassword" type="password" class="input" required minlength="8" />
        </div>
        <div class="row-between">
          <span class="success">{{ passwordSuccess }}</span>
          <button class="btn btn-sm" :disabled="passwordLoading">
            {{ passwordLoading ? '변경 중...' : '비밀번호 변경' }}
          </button>
        </div>
        <p v-if="passwordError" class="error">{{ passwordError }}</p>
      </form>
    </section>

    <section class="mypage-card card">
      <div class="row-between" style="margin-bottom: 16px">
        <h2 class="mypage-section-title" style="margin: 0">내가 올린 질문</h2>
        <span class="muted" style="font-size: 13px">
          최근 {{ myPosts.length }}개
        </span>
      </div>
      <p v-if="postsPending" class="muted">불러오는 중...</p>
      <p v-else-if="myPosts.length === 0" class="muted">작성한 질문이 없습니다.</p>
      <ul v-else class="mypage-posts">
        <li v-for="post in myPosts" :key="post.id">
          <NuxtLink :to="`/posts/${post.id}`" class="mypage-post-link">
            <span class="mypage-post-title">{{ post.title }}</span>
            <span class="muted">{{ formatRelativeTime(post.createdAt) }}</span>
          </NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
