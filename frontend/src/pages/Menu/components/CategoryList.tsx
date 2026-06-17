import { Button } from '../../../components/atoms';
import React from 'react';
import { Category, MenuItem } from '../../../types/models';
import { api } from '../../../lib/ipc';
import { useModal } from '../../../hooks/useModal';

type MenuData = Category & { items: MenuItem[] };

interface Props {
  categories: MenuData[];
  selectedCategoryId: number | null;
  onSelect: (id: number) => void;
  onEdit: (cat: Category) => void;
  onAdd: () => void;
  onRefresh: () => void;
}

const CategoryList: React.FC<Props> = ({ categories, selectedCategoryId, onSelect, onEdit, onAdd, onRefresh }) => {
  const { showModal, hideModal } = useModal();
  
  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    showModal({
      title: 'Delete Category',
      content: <p className="text-gray-600">Are you sure you want to delete this category? All its items will also be deleted.</p>,
      size: 'sm',
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button 
            variant="ghost" 
            className="text-red-600 hover:bg-red-50 bg-red-50" 
            onClick={() => {
              api.menu.deleteCategory({ id }).then(res => {
                if (res.success) {onRefresh();}
                hideModal();
              }).catch((err: unknown) => {
                console.error(err);
              });
            }}
          >
            Delete
          </Button>
        </>
      )
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h2 className="font-bold text-lg text-gray-800">Categories</h2>
        <Button variant="primary" size="sm" onClick={onAdd}>+ Add</Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {categories.map(cat => (
          <div 
            key={cat.id}
            onClick={() => { onSelect(cat.id); }}
            className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${
              selectedCategoryId === cat.id 
                ? 'bg-blue-50 border-blue-200 border text-blue-800' 
                : 'hover:bg-gray-100 border border-transparent'
            }`}
          >
            <div>
              <div className="font-medium">{cat.name}</div>
              <div className="text-xs text-gray-500">{cat.items.length} items</div>
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-blue-600"
                onClick={(e) => { e.stopPropagation(); onEdit(cat); }}
              >
                ✎
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-red-600"
                onClick={(e) => { handleDelete(e, cat.id); }}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            No categories found. Click + Add to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryList;
