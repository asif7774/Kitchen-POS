import { ipcMain } from 'electron';
import { getDB } from '../db';

interface CategoryRow {
  id: number;
  name: string;
  sort_order: number;
  is_active: number;
}

interface MenuItemRow {
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
}

interface UpsertCategoryPayload {
  id?: number;
  name: string;
  sort_order?: number;
}

interface DeleteCategoryPayload {
  id: number;
}

interface UpsertItemPayload {
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
}

interface DeleteItemPayload {
  id: number;
}

interface ToggleAvailablePayload {
  id: number;
  is_available: number;
}

interface RecipeItemPayload {
  inventory_item_id: number;
  qty_used: number;
}

interface UpdateRecipePayload {
  menu_item_id: number;
  ingredients: RecipeItemPayload[];
}

export function registerMenuIPC() {
  ipcMain.handle('menu:getAll', async () => {
    try {
      const db = getDB();
      const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC').all() as CategoryRow[];
      const items = db.prepare('SELECT * FROM menu_items ORDER BY sort_order ASC').all() as MenuItemRow[];
      
      const mappedCategories = categories.map(cat => ({
        ...cat,
        items: items.filter(item => item.category_id === cat.id)
      }));

      return { success: true, data: mappedCategories };
    } catch (e: unknown) {
      if (e instanceof Error) {
        return { success: false, error: e.message };
      }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:upsertCategory', async (_, payload: UpsertCategoryPayload) => {
    try {
      const db = getDB();
      if (payload.id) {
        db.prepare('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?')
          .run(payload.name, payload.sort_order ?? 0, payload.id);
        return { success: true, data: { id: payload.id } };
      } else {
        const result = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)')
          .run(payload.name, payload.sort_order ?? 0);
        return { success: true, data: { id: result.lastInsertRowid } };
      }
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:deleteCategory', async (_, payload: DeleteCategoryPayload) => {
    try {
      const db = getDB();
      db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(payload.id);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:upsertItem', async (_, payload: UpsertItemPayload) => {
    try {
      const db = getDB();
      if (payload.id) {
        const stmt = db.prepare(`
          UPDATE menu_items 
          SET category_id = ?, name = ?, price = ?, cgst_rate = ?, sgst_rate = ?, hsn_code = ?, is_veg = ?, sort_order = ?, is_available = ?
          WHERE id = ?
        `);
        stmt.run(
          payload.category_id, payload.name, payload.price, payload.cgst_rate ?? 0, payload.sgst_rate ?? 0, 
          payload.hsn_code ?? null, payload.is_veg ?? 1, payload.sort_order ?? 0, payload.is_available ?? 1,
          payload.id
        );
        return { success: true, data: { id: payload.id } };
      } else {
        const stmt = db.prepare(`
          INSERT INTO menu_items (category_id, name, price, cgst_rate, sgst_rate, hsn_code, is_veg, sort_order, is_available)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
          payload.category_id, payload.name, payload.price, payload.cgst_rate ?? 0, payload.sgst_rate ?? 0, 
          payload.hsn_code ?? null, payload.is_veg ?? 1, payload.sort_order ?? 0, payload.is_available ?? 1
        );
        return { success: true, data: { id: result.lastInsertRowid } };
      }
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:deleteItem', async (_, payload: DeleteItemPayload) => {
    try {
      const db = getDB();
      db.prepare('DELETE FROM menu_items WHERE id = ?').run(payload.id);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:toggleAvailable', async (_, payload: ToggleAvailablePayload) => {
    try {
      const db = getDB();
      db.prepare('UPDATE menu_items SET is_available = ? WHERE id = ?').run(payload.is_available, payload.id);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:getRecipe', async (_, payload: { menu_item_id: number }) => {
    try {
      const db = getDB();
      const recipe = db.prepare(`
        SELECT m.inventory_item_id, m.qty_used, i.name, i.unit 
        FROM menu_inventory_map m
        JOIN inventory_items i ON m.inventory_item_id = i.id
        WHERE m.menu_item_id = ?
      `).all(payload.menu_item_id);
      return { success: true, data: recipe };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:updateRecipe', async (_, payload: UpdateRecipePayload) => {
    try {
      const db = getDB();
      const transaction = db.transaction((menu_item_id: number, ingredients: RecipeItemPayload[]) => {
        db.prepare('DELETE FROM menu_inventory_map WHERE menu_item_id = ?').run(menu_item_id);
        
        const insertStmt = db.prepare('INSERT INTO menu_inventory_map (menu_item_id, inventory_item_id, qty_used) VALUES (?, ?, ?)');
        for (const ing of ingredients) {
          insertStmt.run(menu_item_id, ing.inventory_item_id, ing.qty_used);
        }
      });
      
      transaction(payload.menu_item_id, payload.ingredients);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });
}
