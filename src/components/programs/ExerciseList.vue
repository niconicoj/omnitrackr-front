<script setup lang="ts">
import type { Exercise, ExerciseSet } from '@/stores/base'
import {
  DeleteRound,
  KeyboardArrowUpRound,
  KeyboardArrowDownRound,
  RestartAltRound,
  SnoozeRound,
  AddRound,
  RemoveRound,
  ContentCopyRound,
} from '@vicons/material'

const exercises = defineModel<Exercise[]>({ required: true })

const moveExercise = (direction: 'up' | 'down', exercise: Exercise) => {
  const index = exercises.value.findIndex((e) => e.uuid === exercise.uuid)
  if (index === -1) return
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= exercises.length) return
  exercises.value.splice(index, 1)
  exercises.value.splice(newIndex, 0, exercise)
}

const deleteExercise = (exercise: Exercise) => {
  const index = exercises.value.findIndex((e) => e.uuid === exercise.uuid)
  if (index === -1) return
  exercises.value.splice(index, 1)
}

const cloneSet = (exercise: Exercise, index: number) => {
  const newSet = { ...exercise.sets[index] }
  exercise.sets.splice(index, 0, newSet)
}

const onCreate = (): ExerciseSet => {
  return {
    uuid: crypto.randomUUID(),
    reps: 10,
    weight: {
      kind: 'kg',
      amount: 10,
    },
  }
}
</script>

<template>
  <n-list bordered>
    <template #header>
      <n-h2 style="margin: 0"><n-text> Exercises </n-text></n-h2></template>
    <n-list-item v-for="(exercise, index) in exercises" :key="exercise.uuid">
      <n-thing>
        <template #header>
          <editable-text v-model="exercise.name">
            <n-h3 style="margin: 0"><n-text> {{ exercise.name }} </n-text></n-h3>
          </editable-text>
        </template>
        <n-dynamic-input v-model:value="exercise.sets" :on-create="onCreate" item-style="flex-wrap: wrap; gap: 8px;">
          <template #create-button-default> Add a set </template>
          <template #default="{ value }">
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 12px; width: 100%">
              <n-input-number v-model:value="value.reps">
                <template #prefix>
                  <n-icon>
                    <RestartAltRound />
                  </n-icon>
                </template>
              </n-input-number>

              <weight-input v-model="value.weight" />
              <n-input-number v-model:value="value.restSeconds">
                <template #prefix>
                  <n-icon>
                    <SnoozeRound />
                  </n-icon>
                </template>
              </n-input-number>
            </div>
          </template>
          <template #action="{ index, create, remove }">
            <n-button ghost circle @click.stop="cloneSet(exercise, index)" aria-description="clone sets">
              <n-icon>
                <ContentCopyRound />
              </n-icon>
            </n-button>
            <n-button-group horizontal>
              <n-button ghost circle @click.stop="remove(index)" :aria-description="`remove exercise ${index}`">
                <n-icon>
                  <RemoveRound />
                </n-icon>
              </n-button>
              <n-button ghost circle @click.stop="create(index)" :aria-description="`create a new exercise`">
                <n-icon>
                  <AddRound />
                </n-icon>
              </n-button>
            </n-button-group>
          </template>
        </n-dynamic-input>
      </n-thing>
      <template #prefix>
        <n-button-group vertical>
          <n-button :disabled="index === 0" ghost circle @click.stop="moveExercise('up', exercise)"
            :aria-description="`move the ${exercise.name} program up`">
            <n-icon>
              <KeyboardArrowUpRound />
            </n-icon>
          </n-button>
          <n-button :disabled="index === exercises.length - 1" ghost circle @click.stop="moveExercise('down', exercise)"
            :aria-description="`move the ${exercise.name} program down`">
            <n-icon>
              <KeyboardArrowDownRound />
            </n-icon>
          </n-button>
        </n-button-group>
      </template>
      <template #suffix>
        <n-button quaternary circle type="error" @click.stop="deleteExercise(exercise)"
          :aria-description="`delete the ${exercise.name} exercise`">
          <template #icon>
            <n-icon>
              <DeleteRound />
            </n-icon>
          </template>
        </n-button>
      </template>
    </n-list-item>
  </n-list>
</template>
