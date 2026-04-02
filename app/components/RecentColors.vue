<script setup lang="ts">
defineProps<{ colors: readonly string[] }>()
const emit = defineEmits<{ pick: [hex: string] }>()
</script>

<template>
  <div v-if="colors.length" class="recent">
    <span class="label">Recent</span>
    <div class="swatches">
      <button
        v-for="hex in colors"
        :key="hex"
        class="swatch"
        :style="{ background: hex }"
        :title="hex"
        @click="emit('pick', hex)"
      />
    </div>
  </div>
</template>

<style scoped>
.recent {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 2px;
}

.label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #3a3a3a;
  flex-shrink: 0;
}

.swatches {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s;
  flex-shrink: 0;
}
.swatch:hover { transform: scale(1.2); }
</style>
