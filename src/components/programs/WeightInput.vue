<script setup lang="ts">
import type { Weight } from '@/stores/base'
import { AccessibilityNewRound, FitnessCenterRound } from '@vicons/material'

const weight = defineModel<Weight>({ required: true })

const updateWeightKind = (value: boolean) => {
  if (value) {
    weight.value = { kind: 'kg', amount: 10.0 }
  } else {
    weight.value.kind = 'bodyweight'
  }
}

const updateWeightAmount = (value: number | null) => {
  if (weight.value.kind !== 'bodyweight' && value) {
    weight.value.amount = value
  }
  return value
}
</script>
<template>
  <div style="display: flex; gap: 8px; align-items: center">
    <n-switch :value="weight.kind !== 'bodyweight'" @update:value="updateWeightKind" size="large">
      <template #checked-icon>
        <n-icon :component="FitnessCenterRound" />
      </template>
      <template #unchecked-icon>
        <n-icon :component="AccessibilityNewRound" />
      </template>
    </n-switch>
    <n-input-number
      style="max-width: 304px"
      :value="weight.kind !== 'bodyweight' ? weight.amount : null"
      :step="0.5"
      @update:value="updateWeightAmount"
      :precision="1"
      :disabled="weight.kind === 'bodyweight'"
    />
  </div>
</template>
