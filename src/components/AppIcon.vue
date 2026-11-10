<template>
  <svg
    class="app-icon"
    :style="{ width: `${size}px`, height: `${size}px` }"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="inner"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: 'menu' },
  size: { type: Number, default: 18 }
})

const ICONS = {
  setting:
    '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.9 1.9M16.7 16.7l1.9 1.9M18.6 5.4l-1.9 1.9M7.3 16.7l-1.9 1.9"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
  app: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/>',
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10.5V20h11v-9.5"/>',
  user: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c0-3.6 2.9-5.6 6.5-5.6s6.5 2 6.5 5.6"/>',
  dashboard:
    '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2"/><rect x="13" y="3.5" width="7.5" height="4.5" rx="1.2"/><rect x="13" y="10" width="7.5" height="10.5" rx="1.2"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.2"/>'
}

const inner = computed(() => ICONS[props.name] || ICONS.menu)
</script>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
