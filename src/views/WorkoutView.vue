<script setup lang="ts">
import { useBaseStore } from '@/stores/base'
import { useSettingsStore } from '@/stores/settings'
import { CompilationStatus, compileWorkout, type WorkoutStep } from '@/stores/workout'
import { speak as ttsSpeak } from '@/tts'
import {
  KeyboardArrowLeftRound,
  KeyboardArrowRightRound,
  KeyboardDoubleArrowLeftRound,
  KeyboardDoubleArrowRightRound,
  PauseRound,
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
  restElapsed.value = 0
  currentStepIdx.value = Math.min(currentStepIdx.value + 1, workoutSteps.value.length - 1)
  if (settings.value.speechSynthesis) {
    if (currentStep.value.kind == 'exercise') {
      speak(currentStep.value.text, { onEnd: advance })
    } else if (currentStep.value.kind == 'rest') {
      speak(currentStep.value.text)
      restDuration.value = currentStep.value.duration
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
      style="display: flex; flex-direction: column; align-items: center; gap: 64px; height: 100%"
    >
      <n-h2 style="margin: 0">
        <n-text type="primary"> {{ program.name }} </n-text>
      </n-h2>

      <template v-if="compilationStatus === CompilationStatus.compiling">
        <n-progress
          style=""
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
        <n-p>Generating voice instructions...</n-p>
      </template>
      <template v-else>
        <n-h4 v-if="currentStep && currentStep.kind === 'start'"> Start the workout </n-h4>
        <n-h4 v-else-if="currentStep && currentStep.kind === 'end'"> Workout finished </n-h4>
        <n-h4 v-else-if="currentExercise && currentExercise.kind === 'exercise'">
          {{ currentExercise.name }}
        </n-h4>
        <n-progress
          style=""
          type="circle"
          :percentage="restProgress"
          :color="themeVars.successColor"
          :rail-color="changeColor(themeVars.successColor, { alpha: 0.2 })"
          :indicator-text-color="themeVars.successColor"
        >
          <div v-if="currentStep && currentStep.kind === 'set'">
            <div style="text-align: center">set {{ currentStep.setNumber }}</div>
            <div style="text-align: center">{{ currentStep.reps }} reps</div>
            <div style="text-align: center">{{ currentStep.weight }} kgs</div>
          </div>
          <div v-if="currentStep && currentStep.kind === 'rest'">
            <div style="text-align: center">{{ restDuration - restElapsed }}</div>
          </div>
        </n-progress>
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
          <n-button circle type="primary" :aria-description="`Pause the workout`">
            <template #icon>
              <n-icon>
                <PauseRound />
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
      </template>
    </div>
  </template>
  <template v-else>
    <n-h2>Program not found</n-h2>
  </template>
</template>
