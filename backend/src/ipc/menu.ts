import { ipcMain, dialog, app } from 'electron';
import { getDB } from '../db';
import * as path from 'path';
import * as fs from 'fs';

interface MenuRow {
  id: number;
  name: string;
  is_active: number;
  is_default: number;
}

interface CategoryRow {
  id: number;
  menu_id: number;
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
  image_url: string | null;
}

interface UpsertMenuPayload {
  id?: number;
  name: string;
  is_default?: number;
}

interface UpsertCategoryPayload {
  id?: number;
  menu_id: number;
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
  image_url?: string | null;
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
  ipcMain.handle('menu:getMenus', async () => {
    try {
      const db = getDB();
      const menus = db.prepare('SELECT * FROM menus WHERE is_active = 1 ORDER BY created_at ASC').all() as MenuRow[];
      return { success: true, data: menus };
    } catch (e: unknown) {
      if (e instanceof Error) {return { success: false, error: e.message };}
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:upsertMenu', async (_, payload: UpsertMenuPayload) => {
    try {
      const db = getDB();
      if (payload.id) {
        db.prepare('UPDATE menus SET name = ? WHERE id = ?').run(payload.name, payload.id);
        if (payload.is_default) {
          db.prepare('UPDATE menus SET is_default = 0').run();
          db.prepare('UPDATE menus SET is_default = 1 WHERE id = ?').run(payload.id);
        }
        return { success: true, data: { id: payload.id } };
      }
      
      const result = db.prepare('INSERT INTO menus (name, is_default) VALUES (?, ?)').run(payload.name, payload.is_default ?? 0);
      if (payload.is_default) {
        db.prepare('UPDATE menus SET is_default = 0 WHERE id != ?').run(result.lastInsertRowid);
      }
      return { success: true, data: { id: result.lastInsertRowid } };
    } catch (e: unknown) {
      if (e instanceof Error) {return { success: false, error: e.message };}
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:duplicateMenu', async (_, payload: { id: number, newName: string }) => {
    try {
      const db = getDB();
      const transaction = db.transaction((sourceMenuId: number, name: string) => {
        // Create new menu
        const insertMenu = db.prepare('INSERT INTO menus (name, is_default) VALUES (?, 0)').run(name);
        const newMenuId = insertMenu.lastInsertRowid;
        
        // Clone categories
        const sourceCategories = db.prepare('SELECT * FROM categories WHERE menu_id = ? AND is_active = 1').all(sourceMenuId) as CategoryRow[];
        for (const cat of sourceCategories) {
          const newCat = db.prepare('INSERT INTO categories (menu_id, name, sort_order) VALUES (?, ?, ?)')
            .run(newMenuId, cat.name, cat.sort_order);
          const newCatId = newCat.lastInsertRowid;
          
          // Clone menu items
          const sourceItems = db.prepare('SELECT * FROM menu_items WHERE category_id = ?').all(cat.id) as MenuItemRow[];
          for (const item of sourceItems) {
            const newItem = db.prepare(`
              INSERT INTO menu_items (category_id, name, price, cgst_rate, sgst_rate, hsn_code, is_veg, is_available, sort_order, image_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(newCatId, item.name, item.price, item.cgst_rate, item.sgst_rate, item.hsn_code, item.is_veg, item.is_available, item.sort_order, item.image_url);
            const newItemId = newItem.lastInsertRowid;
            
            // Clone recipes
            const recipes = db.prepare('SELECT inventory_item_id, qty_used FROM menu_inventory_map WHERE menu_item_id = ?').all(item.id) as RecipeItemPayload[];
            for (const r of recipes) {
              db.prepare('INSERT INTO menu_inventory_map (menu_item_id, inventory_item_id, qty_used) VALUES (?, ?, ?)')
                .run(newItemId, r.inventory_item_id, r.qty_used);
            }
          }
        }
        return newMenuId;
      });
      
      const newId = transaction(payload.id, payload.newName);
      return { success: true, data: { id: newId } };
    } catch (e: unknown) {
      if (e instanceof Error) {return { success: false, error: e.message };}
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:uploadImage', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select Dish Image',
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] }]
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'Upload cancelled' };
      }

      const sourceFile = filePaths[0];
      const userDataPath = app.getPath('userData');
      const imagesDir = path.join(userDataPath, 'images');
      
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }

      const ext = path.extname(sourceFile);
      const filename = `dish_${Date.now()}${ext}`;
      const destFile = path.join(imagesDir, filename);

      fs.copyFileSync(sourceFile, destFile);

      // Return a path that can be served (e.g. file://...) or we can serve it later
      return { success: true, data: `file://${destFile}` };
    } catch (e: unknown) {
      if (e instanceof Error) {return { success: false, error: e.message };}
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:getAll', async (_, menuId?: number) => {
    try {
      const db = getDB();
      let targetMenuId = menuId;
      if (!targetMenuId) {
        const defaultMenu = db.prepare('SELECT id FROM menus WHERE is_default = 1').get() as { id: number } | undefined;
        targetMenuId = defaultMenu?.id;
      }
      
      if (!targetMenuId) {
        return { success: true, data: [] };
      }

      const categories = db.prepare('SELECT * FROM categories WHERE menu_id = ? AND is_active = 1 ORDER BY sort_order ASC').all(targetMenuId) as CategoryRow[];
      if (categories.length === 0) {return { success: true, data: [] };}

      const catIds = categories.map(c => c.id).join(',');
      const items = db.prepare(`SELECT * FROM menu_items WHERE category_id IN (${catIds}) ORDER BY sort_order ASC`).all() as MenuItemRow[];
      
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
      } 
      const result = db.prepare('INSERT INTO categories (menu_id, name, sort_order) VALUES (?, ?, ?)')
        .run(payload.menu_id, payload.name, payload.sort_order ?? 0);
      return { success: true, data: { id: result.lastInsertRowid } };
      
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
          SET category_id = ?, name = ?, price = ?, cgst_rate = ?, sgst_rate = ?, hsn_code = ?, is_veg = ?, sort_order = ?, is_available = ?, image_url = ?
          WHERE id = ?
        `);
        stmt.run(
          payload.category_id, payload.name, payload.price, payload.cgst_rate ?? 0, payload.sgst_rate ?? 0, 
          payload.hsn_code ?? null, payload.is_veg ?? 1, payload.sort_order ?? 0, payload.is_available ?? 1, payload.image_url ?? null,
          payload.id
        );
        return { success: true, data: { id: payload.id } };
      } 
      const stmt = db.prepare(`
        INSERT INTO menu_items (category_id, name, price, cgst_rate, sgst_rate, hsn_code, is_veg, sort_order, is_available, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        payload.category_id, payload.name, payload.price, payload.cgst_rate ?? 0, payload.sgst_rate ?? 0, 
        payload.hsn_code ?? null, payload.is_veg ?? 1, payload.sort_order ?? 0, payload.is_available ?? 1, payload.image_url ?? null
      );
      return { success: true, data: { id: result.lastInsertRowid } };
      
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
