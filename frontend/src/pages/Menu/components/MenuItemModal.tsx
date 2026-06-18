import { Button, Input } from '../../../components/atoms';
import React, { useState } from 'react';
import { MenuItem } from '../../../types/models';
import { api } from '../../../lib/ipc';
import { useToast } from '../../../hooks/useToast';

interface Props {
  item: MenuItem | null;
  categoryId: number;

  onSuccess: () => void;
}

const MenuItemModal: React.FC<Props> = ({ item, categoryId, onSuccess }) => {
  const [name, setName] = useState(item?.name ?? '');
  const [price, setPrice] = useState(item ? item.price.toString() : '');
  const [isVeg, setIsVeg] = useState(item ? item.is_veg === 1 : true);
  const [cgst, setCgst] = useState(item?.cgst_rate?.toString() ?? '2.5');
  const [sgst, setSgst] = useState(item?.sgst_rate?.toString() ?? '2.5');
  const [hsn, setHsn] = useState(item?.hsn_code ?? '');
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '');

  const { showToast } = useToast();

  const handleImageUpload = async () => {
    try {
      const res = await api.menu.uploadImage();
      if (res.success && res.data) {
        setImageUrl(res.data);
      } else if (res.error !== 'Upload cancelled') {
        showToast({ message: res.error ?? 'Failed to upload image', variant: 'error' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {return;}


    try {
      const payload: Partial<MenuItem> = {
        name,
        price: parseFloat(price),
        category_id: categoryId,
        is_veg: isVeg ? 1 : 0,
        cgst_rate: parseFloat(cgst) || 0,
        sgst_rate: parseFloat(sgst) || 0,
        hsn_code: hsn,
        image_url: imageUrl || null,
        is_available: item ? item.is_available : 1
      };

      if (item) {payload.id = item.id;}

      const res = await api.menu.upsertItem(payload);
      if (res.success) {
        showToast({ message: 'Dish saved successfully', variant: 'success' });
        onSuccess();
      } else {
        showToast({ message: res.error ?? 'Failed to save menu item', variant: 'error' });
      }
    } catch (err) {
      console.error(err);
      showToast({ message: 'An unexpected error occurred', variant: 'error' });
    }
  };

  return (
    <form id="menu-item-form" onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
      <div className="space-y-4">
        <Input 
          label="Dish Name"
          type="text"
          required
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          placeholder="e.g. Butter Chicken"
          autoFocus
        />

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                <img src={imageUrl} alt="Dish" className="w-12 h-12 rounded object-cover border" />
              )}
              <Button type="button" variant="outline" onClick={() => { void handleImageUpload(); }}>
                {imageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageUrl && (
                <Button type="button" variant="ghost" className="text-red-500" onClick={() => { setImageUrl(''); }}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Price (₹)"
            type="number"
            required
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => { setPrice(e.target.value); }}
            placeholder="0.00"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Type</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                type="button"
                variant="ghost"
                block
                onClick={() => { setIsVeg(true); }}
                className={`rounded-md ${isVeg ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}
              >
                Veg
              </Button>
              <Button
                type="button"
                variant="ghost"
                block
                onClick={() => { setIsVeg(false); }}
                className={`rounded-md ${!isVeg ? 'bg-white shadow-sm text-red-700' : 'text-gray-500'}`}
              >
                Non-Veg
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <h3 className="text-sm font-bold text-gray-800 mb-3">GST & Billing</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <Input 
              label="CGST (%)"
              type="number"
              min="0"
              step="0.1"
              value={cgst}
              onChange={(e) => { setCgst(e.target.value); }}
            />
            <Input 
              label="SGST (%)"
              type="number"
              min="0"
              step="0.1"
              value={sgst}
              onChange={(e) => { setSgst(e.target.value); }}
            />
          </div>

          <Input 
            label="HSN Code"
            type="text"
            value={hsn}
            onChange={(e) => { setHsn(e.target.value); }}
            placeholder="e.g. 2106"
          />
        </div>
      </div>

    </form>
  );
};

export default MenuItemModal;
