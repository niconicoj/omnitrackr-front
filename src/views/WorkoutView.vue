<script setup lang="ts">
import { useBaseStore } from '@/stores/base'
import { useSettingsStore } from '@/stores/settings'
import { CompilationStatus, compileWorkout, formatWeight, type WorkoutStep } from '@/stores/workout'
import { speak as ttsSpeak } from '@/tts'
import {
  KeyboardArrowLeftRound,
  KeyboardArrowRightRound,
  KeyboardDoubleArrowLeftRound,
  KeyboardDoubleArrowRightRound,
  PauseRound,
  PlayArrowRound,
} from '@vicons/material'
import { useThemeVars } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { changeColor } from 'seemly'
import { computed, onUnmounted, ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const themeVars = useThemeVars()
const baseStore = useBaseStore()
const settingsStore = useSettingsStore()

baseStore.selectProgram(route.params.uuid as string)
const { selectedProgram: program } = storeToRefs(baseStore)
const { settings } = storeToRefs(settingsStore)

const compilationStatus = ref(CompilationStatus.notStarted)
const synthesisProgress: Ref<[number, number]> = ref([0, 0])
const workoutSteps: Ref<WorkoutStep[]> = ref([])

if (program.value) {
  compileWorkout({
    program: program.value,
    speechSynthesisEnabled: settings.value.speechSynthesis,
    resultRef: workoutSteps,
    statusRef: compilationStatus,
    progressRef: synthesisProgress,
  })
}

const restElapsed = ref(0)
const restDuration = ref(0)
const restProgress = computed(() => {
  return restDuration.value === 0 ? 0 : (restElapsed.value / restDuration.value) * 100
})
const currentStepIdx = ref(0)
const currentStep = computed(() => {
  return workoutSteps.value[currentStepIdx.value]
})
const intervalId = ref(undefined as undefined | number)
const paused = ref(false)

const pauseButtonDisabled = computed(() => {
  if (!currentStep.value) return true
  return (
    currentStep.value.kind === 'set' ||
    currentStep.value.kind === 'exercise' ||
    currentStep.value.kind === 'end'
  )
})

const pauseButtonIcon = computed(() => {
  if (!currentStep.value) return PlayArrowRound
  if (currentStep.value.kind === 'rest' && !paused.value) return PauseRound
  return PlayArrowRound
})

const togglePause = () => {
  if (pauseButtonDisabled.value) return
  if (currentStep.value?.kind === 'start' || currentStep.value?.kind === 'end') {
    advance()
    return
  }
  if (currentStep.value?.kind !== 'rest') return
  paused.value = !paused.value
  if (paused.value) {
    clearInterval(intervalId.value)
    intervalId.value = undefined
  } else {
    startRestInterval()
  }
}

const startRestInterval = () => {
  intervalId.value = setInterval(() => {
    restElapsed.value += 1
    const remaining = restDuration.value - restElapsed.value
    switch (remaining) {
      case 0:
        advance()
        break
      case 1:
      case 2:
      case 3:
        speak(remaining.toString())
        break
      default:
        break
    }
  }, 1000)
}

const restDisplay = computed(() => {
  const remaining = Math.max(restDuration.value - restElapsed.value, 0)
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const currentExercise = computed(() => {
  const prevExercises = workoutSteps.value.filter(
    (step, index) => step.kind === 'exercise' && index <= currentStepIdx.value,
  )
  if (!prevExercises.length) return null
  return prevExercises[prevExercises.length - 1]
})

const speak = (text?: string, { onEnd }: { onEnd?: () => void } = {}) => {
  ttsSpeak(text, { volume: settings.value.volume, onEnd })
}

const advance = () => {
  clearInterval(intervalId.value)
  intervalId.value = undefined
  restElapsed.value = 0
  paused.value = false
  currentStepIdx.value = Math.min(currentStepIdx.value + 1, workoutSteps.value.length - 1)
  if (settings.value.speechSynthesis) {
    if (currentStep.value.kind == 'exercise') {
      speak(currentStep.value.text, { onEnd: advance })
    } else if (currentStep.value.kind == 'rest') {
      speak(currentStep.value.text)
      restDuration.value = currentStep.value.duration
      startRestInterval()
    } else {
      speak(currentStep.value.text)
    }
  }
}

const goBack = () => {
  currentStepIdx.value = Math.max(currentStepIdx.value - 1, 0)
}

const advanceNextExercise = () => {
  const idx = workoutSteps.value.findIndex((step, index) => {
    return step.kind === 'exercise' && index > currentStepIdx.value
  })
  currentStepIdx.value = idx === -1 ? workoutSteps.value.length - 1 : idx
}

const goBackPreviousExercise = () => {
  currentStepIdx.value = currentExercise.value
    ? workoutSteps.value.findIndex((step) => step === currentExercise.value) - 1
    : 0
}

onUnmounted(() => {
  clearInterval(intervalId.value)
})
</script>

<template>
  <template v-if="program">
    <div
      style="
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      "
    >
      <!-- Top: Program name - fixed at top -->
      <div style="flex: 0 0 auto; padding-bottom: 16px">
        <n-h2 style="margin: 0">
          <n-text type="primary"> {{ program.name }} </n-text>
        </n-h2>
      </div>

      <!-- Middle: takes remaining space, centers content vertically -->
      <div
        style="
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          min-height: 0;
        "
      >
        <template v-if="compilationStatus === CompilationStatus.compiling">
          <n-progress
            type="circle"
            :percentage="(synthesisProgress[0] / synthesisProgress[1]) * 100"
            :processing="compilationStatus === CompilationStatus.compiling"
            :color="themeVars.successColor"
            :rail-color="changeColor(themeVars.successColor, { alpha: 0.2 })"
            :indicator-text-color="themeVars.successColor"
          >
            <span style="text-align: center"
              >{{ synthesisProgress[0] }} / {{ synthesisProgress[1] }}</span
            >
          </n-progress>
          <n-p style="margin: 0">Generating voice instructions...</n-p>
        </template>
        <template v-else>
          <!-- Contextual heading - uses min-height to reserve space even when empty -->
          <div style="min-height: 2em; display: flex; align-items: center">
            <n-h4 v-if="currentStep && currentStep.kind === 'start'" style="margin: 0">
              Start the workout
            </n-h4>
            <n-h4 v-else-if="currentStep && currentStep.kind === 'end'" style="margin: 0">
              Workout finished
            </n-h4>
            <n-h4
              v-else-if="currentExercise && currentExercise.kind === 'exercise'"
              style="margin: 0"
            >
              {{ currentExercise.name }}
            </n-h4>
          </div>
          <n-progress
            type="circle"
            :percentage="restProgress"
            :color="themeVars.successColor"
            :rail-color="changeColor(themeVars.successColor, { alpha: 0.2 })"
            :indicator-text-color="themeVars.successColor"
          >
            <template v-if="currentStep && currentStep.kind === 'set'">
              <span style="font-size: 1.2em">Set {{ currentStep.setNumber }}</span>
            </template>
            <template v-if="currentStep && currentStep.kind === 'rest'">
              <span>{{ restDisplay }}</span>
            </template>
          </n-progress>
          <!-- Reps/weight info - uses min-height to reserve space even when hidden -->
          <div
            style="
              min-height: 3em;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;
            "
          >
            <template v-if="currentStep && currentStep.kind === 'set'">
              <n-text style="font-size: 1.1em">{{ currentStep.reps }} reps</n-text>
              <n-text depth="3">{{ formatWeight(currentStep.weight) }}</n-text>
            </template>
          </div>
        </template>
      </div>

      <!-- Bottom: Control buttons - fixed at bottom -->
      <div
        v-if="compilationStatus !== CompilationStatus.compiling"
        style="flex: 0 0 auto; padding-top: 16px; padding-bottom: 16px"
      >
        <div style="display: flex; gap: 16px">
          <n-button
            circle
            type="primary"
            @click="goBackPreviousExercise"
            :aria-description="`Go back to the previous exercise`"
          >
            <template #icon>
              <n-icon>
                <KeyboardDoubleArrowLeftRound />
              </n-icon>
            </template>
          </n-button>
          <n-button circle type="primary" @click="goBack" :aria-description="`Go back one step`">
            <template #icon>
              <n-icon>
                <KeyboardArrowLeftRound />
              </n-icon>
            </template>
          </n-button>
          <n-button
            circle
            type="primary"
            :disabled="pauseButtonDisabled"
            @click="togglePause"
            :aria-description="paused ? 'Resume the workout' : 'Pause the workout'"
          >
            <template #icon>
              <n-icon>
                <component :is="pauseButtonIcon" />
              </n-icon>
            </template>
          </n-button>
          <n-button circle type="primary" @click="advance" :aria-description="`Go to next step`">
            <template #icon>
              <n-icon>
                <KeyboardArrowRightRound />
              </n-icon>
            </template>
          </n-button>
          <n-button
            circle
            type="primary"
            @click="advanceNextExercise"
            :aria-description="`Go to next exercise`"
          >
            <template #icon>
              <n-icon>
                <KeyboardDoubleArrowRightRound />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>
  </template>
  <template v-else>
    <n-h2>Program not found</n-h2>
  </template>
</template>
