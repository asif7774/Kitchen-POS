export interface MenuRow {
  id: number;
  name: string;
  is_active: number;
  is_default: number;
}

export interface CategoryRow {
  id: number;
  menu_id: number;
  name: string;
  sort_order: number;
  is_active: number;
}

export interface MenuItemRow {
  id: number;
  category_id: number;
  name: string;
  price: number;
  cgst_rate: number;
  sgst_rate: number;
  hsn_code: string | null;
  is_veg: number;
  is_available: number;
  sort_order: number;
  image_url: string | null;
}

export interface UpsertMenuPayload {
  id?: number;
  name: string;
  is_default?: number;
  is_active?: number;
  auto_enable_time?: string | null;
  auto_disable_time?: string | null;
  schedule_enabled?: number;
}

export interface UpsertCategoryPayload {
  id?: number;
  menu_id: number;
  name: string;
  sort_order?: number;
}

export interface DeleteCategoryPayload {
  id: number;
}

export interface UpsertItemPayload {
  id?: number;
  category_id: number;
  name: string;
  price: number;
  cgst_rate?: number;
  sgst_rate?: number;
  hsn_code?: string | null;
  is_veg?: number;
  sort_order?: number;
  is_available?: number;
  image_url?: string | null;
}

export interface DeleteItemPayload {
  id: number;
}

export interface ToggleAvailablePayload {
  id: number;
  is_available: number;
}

export interface RecipeItemPayload {
  inventory_item_id: number;
  qty_used: number;
}

export interface UpdateRecipePayload {
  menu_item_id: number;
  ingredients: RecipeItemPayload[];
}
