import api from './api'
import type {
  Dictionary,
  CreateDictionaryRequest,
  UpdateDictionaryRequest,
  DictionaryType,
  DictionaryTypeConfig,
  CreateDictionaryTypeRequest,
  UpdateDictionaryTypeRequest,
} from '@types'

export interface DictionaryQueryParams {
  type?: DictionaryType
}

export const dictionaryApi = {
  getDictionaries: (params?: DictionaryQueryParams): Promise<Dictionary[]> => {
    const query = new URLSearchParams()
    if (params?.type) {
      query.append('type', params.type)
    }
    const queryString = query.toString()
    const url = queryString ? `/dictionaries?${queryString}` : '/dictionaries'
    return api.get(url)
  },

  getDictionaryById: (id: string): Promise<Dictionary> => api.get(`/dictionaries/${id}`),

  createDictionary: (data: CreateDictionaryRequest): Promise<Dictionary> => api.post('/dictionaries', data),

  updateDictionary: (id: string, data: UpdateDictionaryRequest): Promise<Dictionary> => api.put(`/dictionaries/${id}`, data),

  deleteDictionary: (id: string): Promise<void> => api.delete(`/dictionaries/${id}`),
}

export const dictionaryTypeApi = {
  getDictionaryTypes: (): Promise<DictionaryTypeConfig[]> => api.get('/dictionary-types'),

  createDictionaryType: (data: CreateDictionaryTypeRequest): Promise<DictionaryTypeConfig> => api.post('/dictionary-types', data),

  updateDictionaryType: (key: string, data: UpdateDictionaryTypeRequest): Promise<DictionaryTypeConfig> => api.put(`/dictionary-types/${key}`, data),

  deleteDictionaryType: (key: string): Promise<void> => api.delete(`/dictionary-types/${key}`),
}
