import { defineStore } from 'pinia'

export interface ProgramHeader {
  uuid: string
  name: string
}

export interface Program extends ProgramHeader {
  exercises: Exercise[]
}

export interface Exercise {
  uuid: string
  name: string
  sets: ExerciseSet[]
}

export interface ExerciseSet {
  uuid: string
  weight: Weight
  reps: number
  repeats?: number
  restSeconds?: number
}

export type Weight =
  | {
    kind: 'bodyweight'
  }
  | {
    kind: 'kg'
    amount: number
  }
  | {
    kind: 'lbs'
    amount: number
  }

export const useBaseStore = defineStore('base', {
  state: () => {
    return {
      programHeaders: [] as ProgramHeader[],
      selectedProgram: null as Program | null,
    }
  },
  actions: {
    loadProgramHeaders() {
      const programHeaders = localStorage.getItem('programs')
      if (programHeaders) {
        this.programHeaders = JSON.parse(programHeaders)
      }
    },

    createProgram(name: string) {
      const uuid = crypto.randomUUID()
      const programHeader = { uuid, name }
      this.programHeaders.push(programHeader)
      localStorage.setItem('programs', JSON.stringify(this.programHeaders))
      localStorage.setItem(uuid, JSON.stringify({ ...programHeader, exercises: [] }))
    },

    deleteProgram(uuid: string) {
      this.programHeaders = this.programHeaders.filter((p) => p.uuid !== uuid)
      localStorage.setItem('programs', JSON.stringify(this.programHeaders))
      localStorage.removeItem(uuid)
    },

    selectProgram(uuid: string) {
      const program = localStorage.getItem(uuid)
      if (program) {
        this.selectedProgram = JSON.parse(program)
      }
    },

    createExercise(name: string) {
      if (!this.selectedProgram) return
      const uuid = crypto.randomUUID()
      const newExercise = { uuid, name, sets: [] }
      this.selectedProgram.exercises.push(newExercise)
      localStorage.setItem(this.selectedProgram.uuid, JSON.stringify(this.selectedProgram))
    },

    saveSelectedProgram() {
      if (!this.selectedProgram) return
      localStorage.setItem(this.selectedProgram.uuid, JSON.stringify(this.selectedProgram))
    },

    swapExercise(direction: 'up' | 'down', exercise: Exercise) {
      if (!this.selectedProgram) return
      const index = this.selectedProgram.exercises.findIndex((e) => e.uuid === exercise.uuid)
      if (index === -1) return
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= this.selectedProgram.exercises.length) return
      this.selectedProgram.exercises.splice(index, 1)
      this.selectedProgram.exercises.splice(newIndex, 0, exercise)
      localStorage.setItem(this.selectedProgram.uuid, JSON.stringify(this.selectedProgram))
    },
  },
})
