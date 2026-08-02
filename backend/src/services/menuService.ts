import { getDB } from '../db';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import {
  MenuRow,
  CategoryRow,
  MenuItemRow,
  UpsertMenuPayload,
  UpsertCategoryPayload,
  DeleteCategoryPayload,
  UpsertItemPayload,
  DeleteItemPayload,
  ToggleAvailablePayload,
  RecipeItemPayload,
  UpdateRecipePayload
} from '../types/menu';

export class MenuService {
  getMenus(): MenuRow[] {
    const db = getDB();
    return db.prepare('SELECT * FROM menus ORDER BY created_at ASC').all() as MenuRow[];
  }

  upsertMenu(payload: UpsertMenuPayload): { id: number } {
    const db = getDB();
    if (payload.id) {
      db.prepare('UPDATE menus SET name = ?, is_active = ?, auto_enable_time = ?, auto_disable_time = ?, schedule_enabled = ? WHERE id = ?')
        .run(payload.name, payload.is_active ?? 1, payload.auto_enable_time ?? null, payload.auto_disable_time ?? null, payload.schedule_enabled ?? 0, payload.id);
      if (payload.is_default) {
        db.prepare('UPDATE menus SET is_default = 0').run();
        db.prepare('UPDATE menus SET is_default = 1 WHERE id = ?').run(payload.id);
      }
      return { id: payload.id };
    }
    
    const result = db.prepare('INSERT INTO menus (name, is_default, is_active, auto_enable_time, auto_disable_time, schedule_enabled) VALUES (?, ?, ?, ?, ?, ?)')
      .run(payload.name, payload.is_default ?? 0, payload.is_active ?? 1, payload.auto_enable_time ?? null, payload.auto_disable_time ?? null, payload.schedule_enabled ?? 0);
    if (payload.is_default) {
      db.prepare('UPDATE menus SET is_default = 0 WHERE id != ?').run(result.lastInsertRowid);
    }
    return { id: result.lastInsertRowid as number };
  }

  duplicateMenu(id: number, newName: string): { id: number } {
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
    
    const newId = transaction(id, newName);
    return { id: newId as number };
  }

  uploadImage(sourceFile: string): string {
    const userDataPath = app.getPath('userData');
    const imagesDir = path.join(userDataPath, 'images');
    
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const ext = path.extname(sourceFile);
    const filename = `dish_${Date.now()}${ext}`;
    const destFile = path.join(imagesDir, filename);

    fs.copyFileSync(sourceFile, destFile);

    // Return a path that can be served securely via custom protocol
    return `local://${destFile}`;
  }

  getAll(menuId?: number): any[] {
    const db = getDB();
    let targetMenuId = menuId;
    if (!targetMenuId) {
      const defaultMenu = db.prepare('SELECT id FROM menus WHERE is_default = 1').get() as { id: number } | undefined;
      targetMenuId = defaultMenu?.id;
    }
    
    if (!targetMenuId) {
      return [];
    }

    const categories = db.prepare('SELECT * FROM categories WHERE menu_id = ? AND is_active = 1 ORDER BY sort_order ASC').all(targetMenuId) as CategoryRow[];
    if (categories.length === 0) {return [];}

    const catIds = categories.map(c => c.id).join(',');
    const items = db.prepare(`SELECT * FROM menu_items WHERE category_id IN (${catIds}) ORDER BY sort_order ASC`).all() as MenuItemRow[];
    
    return categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.category_id === cat.id)
    }));
  }

  upsertCategory(payload: UpsertCategoryPayload): { id: number } {
    const db = getDB();
    if (payload.id) {
      db.prepare('UPDATE categories SET name = ?, sort_order = ? WHERE id = ?')
        .run(payload.name, payload.sort_order ?? 0, payload.id);
      return { id: payload.id };
    } 
    const result = db.prepare('INSERT INTO categories (menu_id, name, sort_order) VALUES (?, ?, ?)')
      .run(payload.menu_id, payload.name, payload.sort_order ?? 0);
    return { id: result.lastInsertRowid as number };
  }

  deleteCategory(payload: DeleteCategoryPayload): void {
    const db = getDB();
    db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(payload.id);
  }

  upsertItem(payload: UpsertItemPayload): { id: number } {
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
      return { id: payload.id };
    } 
    const stmt = db.prepare(`
      INSERT INTO menu_items (category_id, name, price, cgst_rate, sgst_rate, hsn_code, is_veg, sort_order, is_available, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      payload.category_id, payload.name, payload.price, payload.cgst_rate ?? 0, payload.sgst_rate ?? 0, 
      payload.hsn_code ?? null, payload.is_veg ?? 1, payload.sort_order ?? 0, payload.is_available ?? 1, payload.image_url ?? null
    );
    return { id: result.lastInsertRowid as number };
  }

  deleteItem(payload: DeleteItemPayload): void {
    const db = getDB();
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(payload.id);
  }

  toggleAvailable(payload: ToggleAvailablePayload): void {
    const db = getDB();
    db.prepare('UPDATE menu_items SET is_available = ? WHERE id = ?').run(payload.is_available, payload.id);
  }

  getRecipe(payload: { menu_item_id: number }): any[] {
    const db = getDB();
    return db.prepare(`
      SELECT m.inventory_item_id, m.qty_used, i.name, i.unit 
      FROM menu_inventory_map m
      JOIN inventory_items i ON m.inventory_item_id = i.id
      WHERE m.menu_item_id = ?
    `).all(payload.menu_item_id);
  }

  updateRecipe(payload: UpdateRecipePayload): void {
    const db = getDB();
    const transaction = db.transaction((menu_item_id: number, ingredients: RecipeItemPayload[]) => {
      db.prepare('DELETE FROM menu_inventory_map WHERE menu_item_id = ?').run(menu_item_id);
      
      const insertStmt = db.prepare('INSERT INTO menu_inventory_map (menu_item_id, inventory_item_id, qty_used) VALUES (?, ?, ?)');
      for (const ing of ingredients) {
        insertStmt.run(menu_item_id, ing.inventory_item_id, ing.qty_used);
      }
    });
    
    transaction(payload.menu_item_id, payload.ingredients);
  }
}

export const menuService = new MenuService();
