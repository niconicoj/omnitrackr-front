<script setup lang="ts">
import { nextTick, ref } from 'vue'

const modelValue = defineModel<string>()
const editing = ref(false)
const input = ref<HTMLInputElement | null>(null)

const focus = () => {
  nextTick(() => {
    input.value?.focus()
  })
}
</script>

<template>
  <div
    @click="
      () => {
        editing = true
        focus()
      }
    "
  >
    <n-input
      ref="input"
      v-if="editing"
      v-model:value="modelValue"
      @blur="editing = false"
      @keyup.enter="editing = false"
    />
    <slot v-else />
  </div>
</template>
