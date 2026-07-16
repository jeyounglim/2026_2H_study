import { defineStore } from 'pinia';

export interface AuthUser {
  id: number;
  email: string;
  nickname: string;
  profileImage?: string | null;
  isVerified: boolean;
  createdAt: string;
}

export const useAuthStore = defineStore('auth', () => {
  // user 는 Pinia 상태로 관리, token 은 새로고침/SSR 유지를 위해 쿠키에 저장
  const user = ref<AuthUser | null>(null);
  const token = useCookie<string | null>('token', {
    maxAge: 60 * 60 * 24, // 1일
    sameSite: 'lax',
  });

  const isLoggedIn = computed(() => !!user.value);

  async function login(email: string, password: string) {
    const api = useApi();
    const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    token.value = res.token;
    user.value = res.user;
    return res;
  }

  async function register(payload: { email: string; password: string; nickname: string }) {
    const api = useApi();
    return api<{ message: string; emailDelivered: boolean; verifyUrl?: string }>(
      '/auth/register',
      { method: 'POST', body: payload },
    );
  }

  // 페이지 로드/새로고침 시 토큰이 있으면 사용자 정보를 복구한다.
  async function fetchMe() {
    if (!token.value) {
      user.value = null;
      return;
    }
    try {
      const api = useApi();
      const res = await api<{ user: AuthUser }>('/auth/me');
      user.value = res.user;
    } catch {
      logout();
    }
  }

  async function uploadProfileImage(file: File) {
    const api = useApi();
    const body = new FormData();
    body.append('image', file);
    const res = await api<{ message: string; user: AuthUser }>('/auth/profile-image', {
      method: 'POST',
      body,
    });
    user.value = res.user;
    return res;
  }

  async function updateProfile(nickname: string) {
    const api = useApi();
    const res = await api<{ message: string; user: AuthUser }>('/auth/me', {
      method: 'PATCH',
      body: { nickname },
    });
    user.value = res.user;
    return res;
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const api = useApi();
    return api<{ message: string }>('/auth/password', {
      method: 'PATCH',
      body: { currentPassword, newPassword },
    });
  }

  function logout() {
    token.value = null;
    user.value = null;
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    fetchMe,
    uploadProfileImage,
    updateProfile,
    changePassword,
    logout,
  };
});
