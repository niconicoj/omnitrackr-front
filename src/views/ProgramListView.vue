<script setup lang="ts">
import { useBaseStore, type Program } from '@/stores/base'
import { AddRound } from '@vicons/material'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const baseStore = useBaseStore()
const { programHeaders } = storeToRefs(baseStore)

const newProgramName = ref('')
const isModalVisible = ref(false)

const addProgram = () => {
  baseStore.createProgram(newProgramName.value)
  newProgramName.value = ''
  isModalVisible.value = false
}

const selectProgram = (program: Program) => {
  router.push({ name: 'program', params: { uuid: program.uuid } })
}

const deleteProgram = (program: Program) => {
  baseStore.deleteProgram(program.uuid)
}
</script>

<template>
  <program-list :programs="programHeaders" @select="selectProgram" @delete="deleteProgram" />
  <n-float-button
    :right="16"
    :bottom="64"
    @click="isModalVisible = true"
    aria-description="Create a program"
  >
    <n-icon>
      <AddRound />
    </n-icon>
  </n-float-button>
  <n-modal v-model:show="isModalVisible">
    <n-card
      style="width: 80%"
      title="Create a new program"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <n-space>
        <n-input
          v-model:value="newProgramName"
          type="text"
          placeholder="Program name"
          @keyup.enter="addProgram"
        />
        <n-button type="primary" @click="addProgram"> Create </n-button>
      </n-space>
    </n-card>
  </n-modal>
</template>
