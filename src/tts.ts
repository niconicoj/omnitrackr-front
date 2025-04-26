import * as tts from '@diffusionstudio/vits-web'
import localforage from 'localforage'

export const TTS_VOICE_ID = 'en_US-amy-medium'

const audioSpeeches: Map<string, HTMLAudioElement> = new Map()

const hashCode = (str: string) => {
  let hash = 0
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return hash.toString()
}

const saveSpeech = async (key: string, wav: Blob) => {
  localforage.setItem(hashCode(key), wav)
}

const loadSpeech = async (key: string) => {
  return await localforage.getItem<Blob>(hashCode(key))
}

export const loadTTS = async () => {
  const availablesVoices = await tts.stored()
  if (availablesVoices.findIndex((voiceId) => voiceId === TTS_VOICE_ID) === -1) {
    await tts.download(TTS_VOICE_ID, (_) => {})
  }
}

export const synthesizeSpeech = async (text: string) => {
  let wav = await loadSpeech(text)
  if (wav === null) {
    console.log('synthesizing speak:', text)
    const response = await fetch(`${import.meta.env.BASE_URL}api/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      throw new Error('Failed to synthesize speech')
    }
    const wav = await response.blob()
    saveSpeech(text, wav)
    console.log('synthesized speak:', text)
  } else {
    console.log('cached speak:', text)
  }
  return wav as Blob
}

export const speak = async (
  text?: string,
  { volume = 1, onEnd = undefined }: { volume?: number; onEnd?: () => void } = {},
) => {
  if (!text) return
  let audio = audioSpeeches.get(hashCode(text))
  if (!audio) {
    let wav = await synthesizeSpeech(text)
    console.log('synthesized speak:', wav)
    audio = new Audio()
    audio.src = URL.createObjectURL(wav)
  }
  console.log('playing audio:', audio)
  audio.volume = volume
  if (onEnd) audio.onended = onEnd
  audio.play()
}
