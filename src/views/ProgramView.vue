<script setup lang="ts">
import { useBaseStore } from '@/stores/base'
import { useRoute, useRouter } from 'vue-router'
import { AddRound, PlayArrowRound } from '@vicons/material'
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()

const baseStore = useBaseStore()
baseStore.selectProgram(route.params.uuid as string)
const { selectedProgram } = storeToRefs(baseStore)

watch(
  selectedProgram,
  async (program) => {
    if (!program) return
    baseStore.saveSelectedProgram()
  },
  { deep: true },
)

const newExerciseName = ref('')
const isModalVisible = ref(false)

const addExercise = () => {
  baseStore.createExercise(newExerciseName.value)
  newExerciseName.value = ''
  isModalVisible.value = false
}

const startWorkout = () => {
  if (!selectedProgram.value) return
  router.push({ name: 'workout', params: { uuid: selectedProgram.value.uuid } })
}
</script>

<template>
  <template v-if="selectedProgram">
    <n-h2 style="margin: 0">
      <n-text type="primary"> {{ selectedProgram.name }} </n-text>
    </n-h2>
    <exercise-list v-model="selectedProgram.exercises" />
    <n-float-button-group :right="16" :bottom="64">
      <n-float-button @click="startWorkout">
        <n-icon>
          <PlayArrowRound />
        </n-icon>
      </n-float-button>
      <n-float-button
        @click="isModalVisible = true"
        aria-description="Create a new exercise"
        type="primary"
      >
        <n-icon>
          <AddRound />
        </n-icon>
      </n-float-button>
    </n-float-button-group>
    <n-modal v-model:show="isModalVisible">
      <n-card
        style="width: 80%"
        title="Create a new exercise"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-space>
          <n-input
            v-model:value="newExerciseName"
            type="text"
            placeholder="Exercise name"
            @keyup.enter="addExercise"
          />
          <n-button type="primary" @click="addExercise"> Create </n-button>
        </n-space>
      </n-card>
    </n-modal>
  </template>
  <template v-else> No program selected </template>
</template>
