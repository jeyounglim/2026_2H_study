<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    email?: string | null;
    nickname?: string | null;
    profileImage?: string | null;
    editable?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    editable: false,
    size: 'md',
  },
);

const emit = defineEmits<{
  uploaded: [];
  error: [message: string];
}>();

const auth = useAuthStore();
const mediaUrl = useMediaUrl();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

const imageSrc = computed(() => mediaUrl(props.profileImage));
const initial = computed(() => useUserInitial(props.email, props.nickname));

function openPicker() {
  if (!props.editable || uploading.value) return;
  fileInput.value?.click();
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  uploading.value = true;
  try {
    await auth.uploadProfileImage(file);
    emit('uploaded');
  } catch (e: any) {
    emit('error', e?.data?.message || '프로필 이미지 업로드에 실패했습니다.');
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <component
    :is="editable ? 'button' : 'span'"
    :type="editable ? 'button' : undefined"
    class="user-avatar"
    :class="[`user-avatar--${size}`, { 'user-avatar--editable': editable, 'user-avatar--uploading': uploading }]"
    :disabled="editable ? uploading : undefined"
    :title="editable ? '프로필 이미지 변경' : undefined"
    :aria-label="editable ? '프로필 이미지 변경' : undefined"
    @click="openPicker"
  >
    <img v-if="imageSrc" :src="imageSrc" alt="" class="user-avatar-img" />
    <span v-else class="user-avatar-initial">{{ initial }}</span>
    <span v-if="editable" class="user-avatar-edit" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path
          fill="currentColor"
          d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Zm8-4.4h-1.1l-.7-1.7A2 2 0 0 0 16.3 7.5H7.7a2 2 0 0 0-1.9 1.6L5.1 10.8H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.2a2 2 0 0 0-2-2ZM12 17a4.8 4.8 0 1 1 0-9.6A4.8 4.8 0 0 1 12 17Z"
        />
      </svg>
    </span>
    <input
      v-if="editable"
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="user-avatar-input"
      @change="onFileChange"
    />
  </component>
</template>
