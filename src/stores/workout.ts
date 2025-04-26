import type { Ref } from 'vue'
import type { Program, Weight } from './base'
import { synthesizeSpeech } from '@/tts'

export const COMMON_SENTENCES = {
  start: 'Starting workout',
  one: '1',
  two: '2',
  three: '3',
  finish: 'Workout finished',
}

export type WorkoutStepKind = 'start' | 'exercise' | 'set' | 'rest' | 'end'

export type WorkoutStep =
  | {
    kind: 'start'
    text?: string
  }
  | {
    kind: 'exercise'
    name: string
    setCount: number
    text?: string
  }
  | {
    kind: 'set'
    reps: number
    weight: Weight
    setNumber: number
    text?: string
  }
  | {
    kind: 'rest'
    duration: number
    text?: string
  }
  | {
    kind: 'end'
    text?: string
  }

export enum CompilationStatus {
  notStarted,
  compiling,
  finished,
  error,
}

export const compileWorkout = async ({
  program,
  speechSynthesisEnabled,
  progressRef,
  resultRef,
  statusRef,
}: {
  program: Program
  speechSynthesisEnabled?: boolean
  progressRef?: Ref<[number, number]>
  resultRef?: Ref<WorkoutStep[]>
  statusRef?: Ref<CompilationStatus>
}): Promise<WorkoutStep[]> => {
  if (statusRef) statusRef.value = CompilationStatus.compiling
  let steps = generateWorkoutSteps(program)
  steps.forEach(generateStepText)

  if (speechSynthesisEnabled) {
    let sentences = new Set<string>()
    steps.forEach((step) => {
      if (step.text) sentences.add(step.text)
    })
    if (progressRef) progressRef.value = [0, sentences.size]

    await Promise.all(
      [...Object.values(COMMON_SENTENCES), ...Array.from(sentences.values())].map(
        async (sentence) => {
          await synthesizeSpeech(sentence)
          if (progressRef) progressRef.value = [progressRef.value[0] + 1, progressRef.value[1]]
        },
      ),
    )
  }

  if (statusRef) statusRef.value = CompilationStatus.finished
  if (resultRef) resultRef.value = steps
  return steps
}

const generateWorkoutSteps = (program: Program): WorkoutStep[] => {
  const steps: WorkoutStep[] = []

  steps.push({ kind: 'start' })
  program.exercises.forEach((exercise) => {
    steps.push({ kind: 'exercise', name: exercise.name, setCount: exercise.sets.length })
    exercise.sets.forEach((set, setIndex) => {
      steps.push({
        kind: 'set',
        reps: set.reps,
        weight: set.weight,
        setNumber: setIndex + 1,
      })
      if (set.restSeconds) {
        steps.push({ kind: 'rest', duration: set.restSeconds })
      }
    })
  })
  steps.push({ kind: 'end' })

  return steps
}

const generateStepText = (step: WorkoutStep) => {
  if (step.kind === 'start') {
    step.text = COMMON_SENTENCES.start
  } else if (step.kind === 'exercise') {
    step.text = step.name
  } else if (step.kind === 'set') {
    const weight =
      step.weight.kind === 'lbs'
        ? `${step.weight.amount} pounds`
        : step.weight.kind === 'kg'
          ? `${step.weight.amount} kilograms`
          : 'bodyweight'
    step.text = `Set ${step.setNumber}, ${step.reps} reps with ${weight}`
  } else if (step.kind === 'rest') {
    step.text = `Rest for ${humanizeDuration(step.duration)}`
  } else if (step.kind === 'end') {
    step.text = COMMON_SENTENCES.finish
  }
}

const humanizeDuration = (seconds: number): string => {
  let minutes = Math.floor(seconds / 60)
  let remainingSeconds = seconds % 60
  if (minutes === 0) return `${remainingSeconds} seconds`
  else if (remainingSeconds === 0) return `${minutes} minutes`
  else return `${minutes} minutes and ${remainingSeconds} seconds`
}
