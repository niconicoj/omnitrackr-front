<script setup lang="ts">
import type { AppSettings } from '@/stores/settings'

const settings = defineModel<AppSettings>('settings', { required: true })
const show = defineModel<boolean>('show', { required: true })
</script>

<template>
  <n-drawer v-model:show="show" :width="502" :placement="'right'">
    <n-drawer-content title="Settings">
      <n-grid x-gap="16" y-gap="16" :cols="2">
        <n-gi>
          <span>Speech synthesis </span>
        </n-gi>
        <n-gi>
          <n-switch v-model:value="settings.speechSynthesis" />
        </n-gi>
        <n-gi>
          <span>Audio volumne </span>
        </n-gi>
        <n-gi>
          <n-slider v-model:value="settings.volume" :min="0" :max="1" :step="0.01" />
        </n-gi>
      </n-grid>
    </n-drawer-content>
  </n-drawer>
</template>
