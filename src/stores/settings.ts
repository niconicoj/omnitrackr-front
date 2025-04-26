import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface AppSettings {
  speechSynthesis: boolean
  volume: number
}

export const useSettingsStore = defineStore('settings', () => {
  const settingsJson = localStorage.getItem('settings')
  const settings = ref(
    (settingsJson ? JSON.parse(settingsJson) : { speechSynthesis: true, volume: 1 }) as AppSettings,
  )
  watch(
    settings,
    (newSettings) => {
      localStorage.setItem('settings', JSON.stringify(newSettings))
    },
    { deep: true },
  )

  return {
    settings,
  }
})
