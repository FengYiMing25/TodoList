export type WardrobeStatus = 'in_use' | 'discarded';

export type WardrobeCategory = 
  | '厨具'
  | '衣服'
  | '鞋子'
  | '电子产品'
  | '家具'
  | '书籍'
  | '运动器材'
  | '其他';

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  price: number;
  purchaseDate: string;
  imageUrl?: string;
  status: WardrobeStatus;
  discardDate?: string;
  discardReason?: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  usageDays?: number;
  dailyValue?: number;
}

export interface CreateWardrobeRequest {
  name: string;
  category: WardrobeCategory;
  price: number;
  purchaseDate: string;
  imageUrl?: string;
  description?: string;
}

export interface UpdateWardrobeRequest {
  name?: string;
  category?: WardrobeCategory;
  price?: number;
  purchaseDate?: string;
  imageUrl?: string;
  description?: string;
}

export interface DiscardWardrobeRequest {
  discardDate: string;
  discardReason?: string;
}

export interface WardrobeQueryParams {
  page?: number;
  limit?: number;
  category?: WardrobeCategory;
  status?: WardrobeStatus;
  keyword?: string;
  sortBy?: 'createdAt' | 'price' | 'purchaseDate' | 'usageDays';
  sortOrder?: 'asc' | 'desc';
}

export interface WardrobeStatistics {
  totalItems: number;
  inUseCount: number;
  discardedCount: number;
  totalValue: number;
  avgUsageDays: number;
  categoryStats: CategoryStatistic[];
}

export interface CategoryStatistic {
  category: string;
  count: number;
  totalValue: number;
  avgUsageDays: number;
}
