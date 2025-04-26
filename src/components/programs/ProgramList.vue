<script setup lang="ts">
import type { Program } from '@/stores/base'
import { DeleteRound } from '@vicons/material'

const props = defineProps<{
  programs: Program[]
}>()

const emit = defineEmits<{
  select: [program: Program]
  delete: [program: Program]
}>()
</script>

<template>
  <n-list hoverable clickable bordered>
    <template #header>
      <n-h2 style="margin: 0"><n-text> Programs </n-text></n-h2></template
    >
    <n-list-item
      v-for="program in props.programs"
      :key="program.uuid"
      @click="emit('select', program)"
      aria-role="button"
      :aria-description="`Select the ${program.name} program`"
    >
      <n-thing :title="program.name" />
      <template #suffix>
        <n-button
          quaternary
          circle
          type="error"
          @click.stop="emit('delete', program)"
          :aria-description="`delete the ${program.name} program`"
        >
          <template #icon>
            <n-icon><DeleteRound /></n-icon>
          </template>
        </n-button>
      </template>
    </n-list-item>
  </n-list>
</template>
