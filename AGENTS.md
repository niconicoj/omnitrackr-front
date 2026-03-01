# AGENTS.md

Guidance for agentic coding agents working in this repository.

## Product description

This repository contains code for an app that allows the user to program workouts and then run their program.

## Commands

```sh
bun dev              # Start dev server (port 5173)
bun run build        # Type-check (vue-tsc) + Vite build
bun run build-only   # Vite build only (no type-check)
bun run type-check   # vue-tsc --build only
bun lint             # ESLint with auto-fix
bun format           # Prettier format src/
```

## Architecture Overview

**Stack:** Vue 3 (Composition API, `<script setup>`) + Vite + TypeScript + Pinia + Naive UI (dark theme)

**Routes:**

- `/` → `ProgramListView` — list/create/delete programs
- `/:uuid` → `ProgramView` — edit program exercises and sets
- `/:uuid/workout` → `WorkoutView` — step-through workout with TTS

**Data model** (defined in `src/stores/base.ts`):

- `Program` → has many `Exercise` → each has many `ExerciseSet`
- `Weight` is a discriminated union: `{ kind: 'bodyweight' } | { kind: 'kg', amount: number } | { kind: 'lbs', amount: number }`
- All data is stored in `localStorage` — program headers list under key `"programs"`, each program under its UUID key

**Stores:**

- `useBaseStore` (`src/stores/base.ts`) — CRUD for programs/exercises (Options Store style)
- `useSettingsStore` (`src/stores/settings.ts`) — app settings, auto-persisted via `watch` (Setup Store style)

**TTS** (`src/tts.ts`): `POST /api/synthesize` with `{ text: string }`, returns a WAV blob cached in IndexedDB via `localforage`. Dev server proxies `/api` → `http://127.0.0.1:3000`.

**Auto-imports:** `unplugin-auto-import` injects Vue composables (`ref`, `computed`, `watch`, etc.) and selected Naive UI composables. `unplugin-vue-components` auto-resolves Naive UI components and local components from `src/components/`. Do **not** add manual imports for these.

## TypeScript

- Strict mode (`strict: true`) is enabled via `@vue/tsconfig` — includes `strictNullChecks`, `noImplicitAny`, etc.
- `verbatimModuleSyntax: true` is enforced — use `import type { Foo }` for type-only imports.
- Path alias `@/` resolves to `src/`.
- Type-checking uses `vue-tsc`, not `tsc`, to handle `.vue` files.
- No `noUncheckedIndexedAccess` — array accesses are not automatically typed as `T | undefined`.

## Code Style

### Formatting (Prettier)

- No semicolons
- Single quotes
- 100-character line width

### ESLint

- Flat config (ESLint 9) in `eslint.config.js`
- `eslint-plugin-vue` with `flat/essential` ruleset
- `@vue/eslint-config-typescript` for TypeScript-aware Vue rules
- Prettier formatting rules are skipped in ESLint — run `bun format` separately
- Always run `bun lint` after making changes

### Imports

- `node:` protocol for Node built-ins (e.g., `import { fileURLToPath } from 'node:url'`)
- External library imports before internal `@/` imports
- Use `import type { ... }` for type-only imports (required by `verbatimModuleSyntax`)
- Do **not** import Vue composables, Naive UI components, or local `src/components/` — they are auto-imported

## Naming Conventions

| Category               | Convention                 | Example                                   |
| ---------------------- | -------------------------- | ----------------------------------------- |
| Vue component files    | PascalCase `.vue`          | `EditableText.vue`, `WeightInput.vue`     |
| View files             | PascalCase + `View` suffix | `ProgramListView.vue`, `WorkoutView.vue`  |
| TypeScript files       | camelCase                  | `tts.ts`, `workout.ts`                    |
| Interfaces / types     | PascalCase                 | `Program`, `Exercise`, `WorkoutStep`      |
| Store composables      | `use` prefix + PascalCase  | `useBaseStore`, `useSettingsStore`        |
| Store IDs              | camelCase string           | `'base'`, `'settings'`                    |
| Functions / variables  | camelCase                  | `loadProgramHeaders`, `compileWorkout`    |
| Module-level constants | SCREAMING_SNAKE_CASE       | `COMMON_SENTENCES`, `TTS_VOICE_ID`        |
| Route names            | camelCase string           | `'programList'`, `'program'`, `'workout'` |

## Vue Component Structure

All components use `<script setup lang="ts">` (Composition API). No Options API.

```vue
<script setup lang="ts">
// 1. External library type imports (import type)
// 2. Internal @/ imports
// 3. Props / emits / models via compile-time macros
defineProps<{ programs: Program[] }>()
defineEmits<{ select: [program: Program] }>()
defineModel<string>('name', { required: true }) // preferred over props+emit for v-model

// 4. Store access
const baseStore = useBaseStore()
const { programHeaders } = storeToRefs(baseStore) // always use storeToRefs

// 5. Local reactive state (ref, computed)
// 6. Functions / event handlers
</script>

<template>
  <!-- Naive UI components: no import needed, use kebab-case or PascalCase -->
  <!-- Local components: no import needed, resolved from src/components/ -->
</template>
<!-- No <style> blocks — use inline style attributes for all styling -->
```

Key patterns:

- Use `defineModel` (Vue 3.4+) for two-way bindings instead of `props + emit('update:modelValue')`
- Prefer `<template v-if>` over wrapping `<div>` elements for conditional blocks
- **No `<style>` sections** — all layout and spacing is done via inline `style` attributes and Naive UI component props

## Pinia Store Patterns

Two styles are used depending on complexity:

**Options Store** (`base.ts`) — for stores with multiple actions mutating shared state:

```ts
export const useBaseStore = defineStore('base', {
  state: () => ({ selectedProgram: null as Program | null }),
  actions: {
    createProgram(name: string) {
      // mutate this.* and call localStorage.setItem(...) manually
    },
  },
})
```

**Setup Store** (`settings.ts`) — for simpler stores or when `watch` is more ergonomic:

```ts
export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(defaultSettings)
  watch(settings, (s) => localStorage.setItem('settings', JSON.stringify(s)), { deep: true })
  return { settings }
})
```

No Pinia persist plugin is used — all `localStorage` writes are done manually in actions.

## Error Handling

- Prefer guard clauses with early returns over try/catch:
  ```ts
  if (!this.selectedProgram) return
  ```
- For `fetch` responses, check `response.ok` and throw a descriptive error:
  ```ts
  if (!response.ok) throw new Error('Failed to synthesize speech')
  ```
- No try/catch blocks exist in the codebase — errors from `fetch` and `localStorage` are not caught at the call site
- No global Vue error handler (`app.config.errorHandler`) is configured
- Use `v-if` in templates to guard against null state rather than optional chaining everywhere

## API Calls

- Only one backend endpoint: `POST /api/synthesize` (`src/tts.ts`)
- Use raw `fetch` — no axios or other HTTP client
- Construct URLs with `import.meta.env.BASE_URL` prefix for correct sub-path deployment:
  ```ts
  ;`${import.meta.env.BASE_URL}api/synthesize`
  ```
- Dev server proxies `/api` → `http://127.0.0.1:3000` (configured in `vite.config.ts`)
