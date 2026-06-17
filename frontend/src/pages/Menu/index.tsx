import { Button } from '../../components/atoms';
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/ipc';
import { Category, MenuItem } from '../../types/models';
import CategoryList from './components/CategoryList';
import MenuItemList from './components/MenuItemList';
import CategoryModal from './components/CategoryModal';
import MenuItemModal from './components/MenuItemModal';
import RecipeModal from './components/RecipeModal';
import { Card } from '../../components/atoms/card';
import { useModal } from '../../hooks/useModal';

type MenuData = Category & { items: MenuItem[] };

const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<MenuData[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { showModal, hideModal } = useModal();

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
    <div className="flex h-full bg-gray-50 p-6 overflow-hidden">
      <div className="flex w-full gap-6 max-w-7xl mx-auto h-full">
        {/* Left Column: Categories */}
        <Card className="w-1/3">
          <CategoryList 
            categories={categories}
            selectedCategoryId={activeCategoryId}
            onSelect={setSelectedCategoryId}
            onEdit={(cat) => { 
              showModal({
                title: "Edit Category",
                content: <CategoryModal category={cat} onSuccess={() => { hideModal(); void fetchMenu(); }} />,
                actions: (
                  <>
                    <Button variant="outline" onClick={hideModal}>Cancel</Button>
                    <Button type="submit" form="category-form" variant="primary">Save</Button>
                  </>
                )
              });
            }}
            onAdd={() => { 
              showModal({
                title: "Add Category",
                content: <CategoryModal category={null} onSuccess={() => { hideModal(); void fetchMenu(); }} />,
                actions: (
                  <>
                    <Button variant="outline" onClick={hideModal}>Cancel</Button>
                    <Button type="submit" form="category-form" variant="primary">Save</Button>
                  </>
                )
              });
            }}
            onRefresh={() => { void fetchMenu(); }}
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
                  content: <MenuItemModal item={item} categoryId={activeCategoryId} onSuccess={() => { hideModal(); void fetchMenu(); }} />,
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
                  content: <MenuItemModal item={null} categoryId={activeCategoryId} onSuccess={() => { hideModal(); void fetchMenu(); }} />,
                  actions: (
                    <>
                      <Button variant="outline" onClick={hideModal}>Cancel</Button>
                      <Button type="submit" form="menu-item-form" variant="primary">Save Dish</Button>
                    </>
                  )
                });
              }}
              onRefresh={() => { void fetchMenu(); }}
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
