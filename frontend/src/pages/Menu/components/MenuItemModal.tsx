import React, { useState } from 'react';
import { MenuItem } from '../../../types/models';
import Button from '../../../components/atoms/button/button';
import { api } from '../../../lib/ipc';

interface Props {
  item: MenuItem | null;
  categoryId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const MenuItemModal: React.FC<Props> = ({ item, categoryId, onClose, onSuccess }) => {
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? item.price.toString() : '');
  const [isVeg, setIsVeg] = useState(item ? item.is_veg === 1 : true);
  const [cgst, setCgst] = useState(item?.cgst_rate?.toString() ?? '2.5');
  const [sgst, setSgst] = useState(item?.sgst_rate?.toString() ?? '2.5');
  const [hsn, setHsn] = useState(item?.hsn_code ?? '');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {return;}

    setLoading(true);
    try {
      const payload: Partial<MenuItem> = {
        name,
        price: parseFloat(price),
        category_id: categoryId,
        is_veg: isVeg ? 1 : 0,
        cgst_rate: parseFloat(cgst) || 0,
        sgst_rate: parseFloat(sgst) || 0,
        hsn_code: hsn,
        is_available: item ? item.is_available : 1
      };

      if (item) {payload.id = item.id;}

      const res = await api.menu.upsertItem(payload);
      if (res.success) {onSuccess();}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="menu-item-form" onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Dish Name</label>
          <input 
            type="text"
            required
            value={name}
            onChange={(e) => { setName(e.target.value); }}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. Butter Chicken"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
            <input 
              type="number"
              required
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => { setPrice(e.target.value); }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Dietary Type</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setIsVeg(true); }}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${isVeg ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}
              >
                Veg
              </button>
              <button
                type="button"
                onClick={() => { setIsVeg(false); }}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${!isVeg ? 'bg-white shadow-sm text-red-700' : 'text-gray-500'}`}
              >
                Non-Veg
              </button>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <h3 className="text-sm font-bold text-gray-800 mb-3">GST & Billing</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">CGST (%)</label>
              <input 
                type="number"
                min="0"
                step="0.1"
                value={cgst}
                onChange={(e) => { setCgst(e.target.value); }}
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">SGST (%)</label>
              <input 
                type="number"
                min="0"
                step="0.1"
                value={sgst}
                onChange={(e) => { setSgst(e.target.value); }}
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">HSN Code</label>
            <input 
              type="text"
              value={hsn}
              onChange={(e) => { setHsn(e.target.value); }}
              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. 2106"
            />
          </div>
        </div>
      </div>

      <div className="-mx-6 -mb-4 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
        <Button variant="primary" type="submit" isLoading={loading}>
          Save Dish
        </Button>
      </div>
    </form>
  );
};

export default MenuItemModal;
