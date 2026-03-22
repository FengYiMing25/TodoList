import { create } from 'zustand'
import type {
  Dictionary,
  CreateDictionaryRequest,
  UpdateDictionaryRequest,
  DictionaryType,
  DictionaryTypeConfig,
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
} from '@types'
import { dictionaryApi, dictionaryTypeApi } from '@services/dictionary'
import { dedupeRequest, createDedupeKey } from '@utils/requestDedupe'

interface DictionaryState {
  dictionaries: Dictionary[]
  dictionaryTypes: DictionaryTypeConfig[]
  isLoading: boolean
  fetchDictionaries: (type?: DictionaryType) => Promise<void>
  createDictionary: (data: CreateDictionaryRequest) => Promise<Dictionary>
  updateDictionary: (id: string, data: UpdateDictionaryRequest) => Promise<void>
  deleteDictionary: (id: string) => Promise<void>
  getDictionariesByType: (type: DictionaryType) => Dictionary[]
  fetchDictionaryTypes: () => Promise<void>
  createDictionaryType: (data: CreateDictionaryTypeRequest) => Promise<DictionaryTypeConfig>
  updateDictionaryType: (key: string, data: UpdateDictionaryTypeRequest) => Promise<void>
  deleteDictionaryType: (key: string) => Promise<void>
}

export const useDictionaryStore = create<DictionaryState>((set, get) => ({
  dictionaries: [],
  dictionaryTypes: [],
  isLoading: false,

  fetchDictionaries: async (type?: DictionaryType) => {
    const key = createDedupeKey('dict', type)
    return dedupeRequest(key, async () => {
      set({ isLoading: true })
      try {
        const data = await dictionaryApi.getDictionaries({ type })
        if (type) {
          set((state) => ({
            dictionaries: [
              ...state.dictionaries.filter((d) => d.type !== type),
              ...data,
            ],
            isLoading: false,
          }))
        } else {
          set({ dictionaries: data, isLoading: false })
        }
      } catch (error) {
        set({ isLoading: false })
        throw error
      }
    })
  },

  createDictionary: async (data: CreateDictionaryRequest) => {
    const dictionary = await dictionaryApi.createDictionary(data)
    set((state) => ({
      dictionaries: [...state.dictionaries, dictionary],
    }))
    return dictionary
  },

  updateDictionary: async (id: string, data: UpdateDictionaryRequest) => {
    const dictionary = await dictionaryApi.updateDictionary(id, data)
    set((state) => ({
      dictionaries: state.dictionaries.map((d) =>
        d.id === id ? dictionary : d
      ),
    }))
  },

  deleteDictionary: async (id: string) => {
    await dictionaryApi.deleteDictionary(id)
    set((state) => ({
      dictionaries: state.dictionaries.filter((d) => d.id !== id),
    }))
  },

  getDictionariesByType: (type: DictionaryType) => {
    return get().dictionaries.filter((d) => d.type === type)
  },

  fetchDictionaryTypes: async () => {
    try {
      const data = await dictionaryTypeApi.getDictionaryTypes()
      set({ dictionaryTypes: data })
    } catch (error) {
      throw error
    }
  },

  createDictionaryType: async (data: CreateDictionaryTypeRequest) => {
    const dictionaryType = await dictionaryTypeApi.createDictionaryType(data)
    set((state) => ({
      dictionaryTypes: [...state.dictionaryTypes, dictionaryType],
    }))
    return dictionaryType
  },

  updateDictionaryType: async (key: string, data: UpdateDictionaryTypeRequest) => {
    const dictionaryType = await dictionaryTypeApi.updateDictionaryType(key, data)
    set((state) => ({
      dictionaryTypes: state.dictionaryTypes.map((t) =>
        t.key === key ? dictionaryType : t
      ),
    }))
  },

  deleteDictionaryType: async (key: string) => {
    await dictionaryTypeApi.deleteDictionaryType(key)
    set((state) => ({
      dictionaryTypes: state.dictionaryTypes.filter((t) => t.key !== key),
    }))
  },
}))
