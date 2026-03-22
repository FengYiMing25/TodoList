export type DictionaryType = string;

export interface Dictionary {
  id: string;
  type: DictionaryType;
  name: string;
  color: string;
  icon?: string;
  sortOrder: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDictionaryRequest {
  type: DictionaryType;
  name: string;
  color: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateDictionaryRequest {
  name?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface DictionaryTypeConfig {
  key: DictionaryType;
  label: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface CreateDictionaryTypeRequest {
  key: string;
  label: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateDictionaryTypeRequest {
  label?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}
