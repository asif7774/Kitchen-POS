import React, { useState, useEffect } from 'react';
import { api } from '../../lib/ipc';
import { Category, MenuItem } from '../../types/models';
import CategoryList from './components/CategoryList';
import MenuItemList from './components/MenuItemList';
import CategoryModal from './components/CategoryModal';
import MenuItemModal from './components/MenuItemModal';
import RecipeModal from './components/RecipeModal';

type MenuData = Category & { items: MenuItem[] };

const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<MenuData[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  // Modal states
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isRecipeModalOpen, setRecipeModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const fetchMenu = React.useCallback(async () => {
    try {
      const res = await api.menu.getAll();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch menu', err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.menu.getAll().then(res => {
      if (active && res.success && res.data) {
        setCategories(res.data);
      }
    }).catch((err: unknown) => { console.error(err); });
    return () => { active = false; };
  }, []);

  const activeCategoryId = selectedCategoryId ?? categories[0]?.id;
  const selectedCategory = categories.find(c => c.id === activeCategoryId);

  return (
    <div className="flex h-screen bg-gray-50 p-6 overflow-hidden">
      <div className="flex w-full gap-6 max-w-7xl mx-auto h-full">
        {/* Left Column: Categories */}
        <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <CategoryList 
            categories={categories}
            selectedCategoryId={activeCategoryId}
            onSelect={setSelectedCategoryId}
            onEdit={(cat) => { setEditingCategory(cat); setCategoryModalOpen(true); }}
            onAdd={() => { setEditingCategory(null); setCategoryModalOpen(true); }}
            onRefresh={() => { void fetchMenu(); }}
          />
        </div>

        {/* Right Column: Menu Items */}
        <div className="w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {selectedCategory ? (
            <MenuItemList 
              category={selectedCategory}
              onEdit={(item) => { setEditingItem(item); setItemModalOpen(true); }}
              onRecipeEdit={(item) => { setEditingItem(item); setRecipeModalOpen(true); }}
              onAdd={() => { setEditingItem(null); setItemModalOpen(true); }}
              onRefresh={() => { void fetchMenu(); }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a category to view items
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isCategoryModalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setCategoryModalOpen(false); }}
          onSuccess={() => {
            setCategoryModalOpen(false);
            void fetchMenu();
          }}
        />
      )}

      {isItemModalOpen && activeCategoryId && (
        <MenuItemModal
          item={editingItem}
          categoryId={activeCategoryId}
          onClose={() => { setItemModalOpen(false); }}
          onSuccess={() => {
            setItemModalOpen(false);
            void fetchMenu();
          }}
        />
      )}

      {isRecipeModalOpen && editingItem && (
        <RecipeModal
          item={editingItem}
          onClose={() => { setRecipeModalOpen(false); }}
        />
      )}
    </div>
  );
};

export default MenuPage;
