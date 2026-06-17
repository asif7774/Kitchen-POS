import React from 'react';
import { Category, MenuItem } from '../../../types/models';
import Button from '../../../components/atoms/button/button';
import { api } from '../../../lib/ipc';
import { useModal } from '../../../hooks/useModal';

type MenuData = Category & { items: MenuItem[] };

interface Props {
  category: MenuData;
  onEdit: (item: MenuItem) => void;
  onRecipeEdit: (item: MenuItem) => void;
  onAdd: () => void;
  onRefresh: () => void;
}

const MenuItemList: React.FC<Props> = ({ category, onEdit, onRecipeEdit, onAdd, onRefresh }) => {
  const { showModal, hideModal } = useModal();
  
  const handleDelete = (id: number) => {
    showModal({
      title: 'Delete Dish',
      content: <p className="text-gray-600">Are you sure you want to delete this item?</p>,
      size: 'sm',
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button 
            variant="ghost" 
            className="text-red-600 hover:bg-red-50 bg-red-50" 
            onClick={() => {
              api.menu.deleteItem({ id }).then(res => {
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

  const handleToggle = async (item: MenuItem) => {
    const newStatus = item.is_available === 1 ? 0 : 1;
    const res = await api.menu.toggleAvailable({ id: item.id, is_available: newStatus });
    if (res.success) {onRefresh();}
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="font-bold text-lg text-gray-800">{category.name}</h2>
          <p className="text-sm text-gray-500">{category.items.length} items</p>
        </div>
        <Button variant="primary" onClick={onAdd}>+ Add Dish</Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {category.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.items.map(item => (
              <div key={item.id} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <span 
                      className={`inline-block w-3 h-3 rounded-full ${item.is_veg === 1 ? 'bg-green-500' : 'bg-red-500'}`} 
                      title={item.is_veg === 1 ? 'Veg' : 'Non-Veg'}
                    />
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  </div>
                  <span className="font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
                </div>
                
                <div className="text-xs text-gray-500 mb-4 flex gap-3">
                  <span>CGST: {item.cgst_rate ?? 0}%</span>
                  <span>SGST: {item.sgst_rate ?? 0}%</span>
                  {item.hsn_code && <span>HSN: {item.hsn_code}</span>}
                </div>

                <div className="flex justify-between items-center pt-3 border-t">
                  <label className="flex items-center cursor-pointer gap-2">
                    <input 
                      type="checkbox" 
                      className="form-checkbox text-blue-600 rounded"
                      checked={item.is_available === 1}
                      onChange={() => { void handleToggle(item); }}
                    />
                    <span className={`text-sm font-medium ${item.is_available === 1 ? 'text-green-600' : 'text-gray-400'}`}>
                      {item.is_available === 1 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </label>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { onRecipeEdit(item); }}>Recipe</Button>
                    <Button variant="outline" size="sm" onClick={() => { onEdit(item); }}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => { handleDelete(item.id); }}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No dishes found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemList;
