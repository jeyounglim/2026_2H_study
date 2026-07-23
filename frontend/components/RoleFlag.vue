<script setup lang="ts">
import type { UserLevel } from '~/types';

const props = defineProps<{
  level?: UserLevel | string | null;
}>();

const label = computed(() => {
  if (props.level === 'SENIOR') return 'Senior';
  if (props.level === 'JUNIOR') return 'Junior';
  return null;
});

const tone = computed(() => {
  if (props.level === 'SENIOR') return 'role-flag--senior';
  if (props.level === 'JUNIOR') return 'role-flag--junior';
  return '';
});
</script>

<template>
  <span v-if="label" class="role-flag" :class="tone">{{ label }}</span>
</template>
