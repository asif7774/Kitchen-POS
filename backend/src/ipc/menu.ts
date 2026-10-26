import { ipcMain, dialog } from 'electron';
import { menuService } from '../services/menuService';
import {
  UpsertMenuPayload,
  UpsertCategoryPayload,
  DeleteCategoryPayload,
  UpsertItemPayload,
  DeleteItemPayload,
  ToggleAvailablePayload,
  UpdateRecipePayload
} from '../types/menu';

export function registerMenuIPC() {
  ipcMain.handle('menu:getMenus', async () => {
    try {
      const data = menuService.getMenus();
      return { success: true, data };
    } catch (e: unknown) {
      if (e instanceof Error) {return { success: false, error: e.message };}
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:upsertMenu', async (_, payload: UpsertMenuPayload) => {
    try {
      const data = menuService.upsertMenu(payload);
      return { success: true, data };
    } catch (e: unknown) {
      if (e instanceof Error) {return { success: false, error: e.message };}
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:duplicateMenu', async (_, payload: { id: number, newName: string }) => {
    try {
      const data = menuService.duplicateMenu(payload.id, payload.newName);
      return { success: true, data };
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

      const data = menuService.uploadImage(filePaths[0]);
      return { success: true, data };
    } catch (e: unknown) {
      if (e instanceof Error) {return { success: false, error: e.message };}
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:getAll', async (_, menuId?: number) => {
    try {
      const data = menuService.getAll(menuId);
      return { success: true, data };
    } catch (e: unknown) {
      if (e instanceof Error) {
        return { success: false, error: e.message };
      }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:upsertCategory', async (_, payload: UpsertCategoryPayload) => {
    try {
      const data = menuService.upsertCategory(payload);
      return { success: true, data };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:deleteCategory', async (_, payload: DeleteCategoryPayload) => {
    try {
      menuService.deleteCategory(payload);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:upsertItem', async (_, payload: UpsertItemPayload) => {
    try {
      const data = menuService.upsertItem(payload);
      return { success: true, data };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:deleteItem', async (_, payload: DeleteItemPayload) => {
    try {
      menuService.deleteItem(payload);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:toggleAvailable', async (_, payload: ToggleAvailablePayload) => {
    try {
      menuService.toggleAvailable(payload);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:getRecipe', async (_, payload: { menu_item_id: number }) => {
    try {
      const data = menuService.getRecipe(payload);
      return { success: true, data };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });

  ipcMain.handle('menu:updateRecipe', async (_, payload: UpdateRecipePayload) => {
    try {
      menuService.updateRecipe(payload);
      return { success: true };
    } catch (e: unknown) {
      if (e instanceof Error) { return { success: false, error: e.message }; }
      return { success: false, error: 'Unknown error occurred' };
    }
  });
}
