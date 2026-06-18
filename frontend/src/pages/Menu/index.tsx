import { Button, Select } from '../../components/atoms';
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/ipc';
import { Category, MenuItem, Menu } from '../../types/models';
import CategoryList from './components/CategoryList';
import MenuItemList from './components/MenuItemList';
import CategoryModal from './components/CategoryModal';
import MenuItemModal from './components/MenuItemModal';
import RecipeModal from './components/RecipeModal';
import MenuModal from './components/MenuModal';
import CloneMenuModal from './components/CloneMenuModal';
import { Card } from '../../components/atoms/card';
import { useModal } from '../../hooks/useModal';

type MenuData = Category & { items: MenuItem[] };

const MenuPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  
  const [categories, setCategories] = useState<MenuData[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { showModal, hideModal } = useModal();

  const fetchMenus = React.useCallback(async (selectId?: number) => {
    try {
      const res = await api.menu.getMenus();
      if (res.success && res.data) {
        setMenus(res.data);
        if (res.data.length > 0) {
          const idToSelect = selectId ?? activeMenuId ?? res.data.find(m => m.is_default)?.id ?? res.data[0].id;
          if (activeMenuId !== idToSelect) {
            setActiveMenuId(idToSelect);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch menus', err);
    }
  }, [activeMenuId]);

  const fetchCategories = React.useCallback(async () => {
    if (!activeMenuId) {return;}
    try {
      const res = await api.menu.getAll(activeMenuId);
      if (res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch menu categories', err);
    }
  }, [activeMenuId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMenus();
  }, [fetchMenus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCategories();
  }, [fetchCategories]);

  const activeCategoryId = selectedCategoryId ?? categories[0]?.id;
  const selectedCategory = categories.find(c => c.id === activeCategoryId);
  const activeMenu = menus.find(m => m.id === activeMenuId);

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto mb-4 flex items-center justify-between bg-white p-4 rounded shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg text-gray-700">Select Menu:</h2>
          <div className="w-64">
            <Select 
              value={activeMenuId ?? ''} 
              onChange={(e) => { setActiveMenuId(Number(e.target.value)); }}
            >
              {menus.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.is_default ? '(Default)' : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            showModal({
              title: "Create New Menu",
              content: <MenuModal menu={null} onSuccess={() => { hideModal(); void fetchMenus(); }} />,
              actions: (
                <>
                  <Button variant="outline" onClick={hideModal}>Cancel</Button>
                  <Button type="submit" form="menu-form" variant="primary">Create</Button>
                </>
              )
            });
          }}>+ New Menu</Button>
          
          {activeMenu && (
            <>
              <Button variant="outline" onClick={() => {
                showModal({
                  title: "Edit Menu",
                  content: <MenuModal menu={activeMenu} onSuccess={() => { hideModal(); void fetchMenus(); }} />,
                  actions: (
                    <>
                      <Button variant="outline" onClick={hideModal}>Cancel</Button>
                      <Button type="submit" form="menu-form" variant="primary">Save</Button>
                    </>
                  )
                });
              }}>Rename Menu</Button>

              <Button variant="secondary" onClick={() => {
                showModal({
                  title: `Clone "${activeMenu.name}"`,
                  content: <CloneMenuModal sourceMenu={activeMenu} onSuccess={(newId) => { hideModal(); void fetchMenus(newId); }} />,
                  actions: (
                    <>
                      <Button variant="outline" onClick={hideModal}>Cancel</Button>
                      <Button type="submit" form="clone-menu-form" variant="primary">Clone</Button>
                    </>
                  )
                });
              }}>Duplicate</Button>
            </>
          )}
        </div>
      </div>

      <div className="flex w-full gap-6 max-w-7xl mx-auto h-[calc(100%-80px)]">
        {/* Left Column: Categories */}
        <Card className="w-1/3">
          <CategoryList 
            categories={categories}
            selectedCategoryId={activeCategoryId}
            onSelect={setSelectedCategoryId}
            onEdit={(cat) => { 
              showModal({
                title: "Edit Category",
                content: <CategoryModal category={cat} menuId={activeMenuId as number} onSuccess={() => { hideModal(); void fetchCategories(); }} />,
                actions: (
                  <>
                    <Button variant="outline" onClick={hideModal}>Cancel</Button>
                    <Button type="submit" form="category-form" variant="primary">Save</Button>
                  </>
                )
              });
            }}
            onAdd={() => { 
              if (!activeMenuId) {return;}
              showModal({
                title: "Add Category",
                content: <CategoryModal category={null} menuId={activeMenuId} onSuccess={() => { hideModal(); void fetchCategories(); }} />,
                actions: (
                  <>
                    <Button variant="outline" onClick={hideModal}>Cancel</Button>
                    <Button type="submit" form="category-form" variant="primary">Save</Button>
                  </>
                )
              });
            }}
            onRefresh={() => { void fetchCategories(); }}
          />
        </Card>

        {/* Right Column: Menu Items */}
        <Card className="w-2/3">
          {selectedCategory ? (
            <MenuItemList 
              category={selectedCategory}
              onEdit={(item) => { 
                showModal({
                  title: "Edit Dish",
                  content: <MenuItemModal item={item} categoryId={activeCategoryId} onSuccess={() => { hideModal(); void fetchCategories(); }} />,
                  actions: (
                    <>
                      <Button variant="outline" onClick={hideModal}>Cancel</Button>
                      <Button type="submit" form="menu-item-form" variant="primary">Save Dish</Button>
                    </>
                  )
                });
              }}
              onRecipeEdit={(item) => { 
                showModal({
                  title: `Recipe for ${item.name}`,
                  content: <RecipeModal item={item} onClose={hideModal} />,
                  size: "lg",
                  actions: (
                    <>
                      <Button variant="outline" onClick={hideModal}>Cancel</Button>
                      <Button type="submit" form="recipe-form" variant="primary">Save Recipe</Button>
                    </>
                  )
                });
              }}
              onAdd={() => { 
                showModal({
                  title: "Add Dish",
                  content: <MenuItemModal item={null} categoryId={activeCategoryId} onSuccess={() => { hideModal(); void fetchCategories(); }} />,
                  actions: (
                    <>
                      <Button variant="outline" onClick={hideModal}>Cancel</Button>
                      <Button type="submit" form="menu-item-form" variant="primary">Save Dish</Button>
                    </>
                  )
                });
              }}
              onRefresh={() => { void fetchCategories(); }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a category to view items
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MenuPage;
