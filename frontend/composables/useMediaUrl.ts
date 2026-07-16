export function useMediaUrl() {
  const config = useRuntimeConfig();

  return (path?: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const origin = config.public.apiBase.replace(/\/api\/?$/, '');
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  };
}

export function useUserInitial(email?: string | null, nickname?: string | null) {
  const source = email?.trim() || nickname?.trim() || '';
  return source ? source.charAt(0).toUpperCase() : '?';
}
