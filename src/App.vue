<script setup lang="ts">
import { RouterView } from 'vue-router'
import { darkTheme } from 'naive-ui'
import { useBaseStore } from './stores/base'
import { loadTTS } from './tts'
import { SettingsRound } from '@vicons/material'
import SettingsDrawer from './components/SettingsDrawer.vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useSettingsStore } from './stores/settings'

const baseStore = useBaseStore()
baseStore.loadProgramHeaders()

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)

const showSettings = ref(false)

loadTTS()
</script>

<template>
  <n-config-provider :theme="darkTheme">
    <n-global-style />
    <n-layout position="absolute" content-style="top: 32px;">
      <n-layout-header
        bordered
        style="
          height: 50px;
          padding: 0 24px;
          display: grid;
          grid-template-columns: calc(272px - 32px) 1fr auto;
        "
      >
        <RouterLink to="/" style="text-decoration: none; color: inherit">
          <n-h1 style="margin: 0">
            <n-text type="primary"> Omnitrackr </n-text>
          </n-h1>
        </RouterLink>
        <div style="display: flex; align-items: center; justify-content: end">
          <n-button
            quaternary
            circle
            type="primary"
            @click="showSettings = true"
            aria-label="Settings"
            ><template #icon
              ><n-icon> <SettingsRound /> </n-icon>
            </template>
          </n-button>
        </div>
      </n-layout-header>
      <n-layout-content
        position="absolute"
        content-style="padding: 24px;"
        style="top: 50px; bottom: 50px"
      >
        <RouterView />
      </n-layout-content>
      <n-layout-footer
        bordered
        style="text-align: center; padding: 12px; height: 50px"
        position="absolute"
      >
        <n-text type="secondary"> © 2025 Omnitrackr </n-text>
      </n-layout-footer>
    </n-layout>
    <SettingsDrawer v-model:settings="settings" v-model:show="showSettings" />
  </n-config-provider>
</template>
