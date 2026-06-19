import { Input } from '../../../components/atoms';
import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/ipc';

import { MenuItem } from '../../../types/models';

interface Props {
  menuId: number | null;
  onAddItem: (item: MenuItem) => void;
}

const MenuPanel: React.FC<Props> = ({ menuId, onAddItem }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      if (!menuId) {return;}
      const res = await api.menu.getAll(menuId);
      if (res.success && res.data) {
        const allItems = res.data.flatMap((cat: { items?: MenuItem[] }) => cat.items ?? []);
        setItems(allItems);
      }
    };
    void fetchMenu();
  }, [menuId]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <Input 
          type="text" 
          placeholder="Search menu..." 
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
        />
      </div>
      <div className="flex-1 overflow-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max pb-10">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            className="card hover-lift cursor-pointer flex flex-col justify-between overflow-hidden relative group border-2 border-transparent hover:border-primary-500"
            onClick={() => { onAddItem(item); }}
          >
            {item.image_url ? (
              <div className="w-full h-32 bg-gray-100 relative">
                <img src={item.image_url.replace('file://', 'local://')} alt={item.name} className="w-full h-full object-cover" />
                <span className={`absolute top-2 right-2 w-3 h-3 rounded-full border border-white shadow-sm ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
            ) : (
              <div className="pt-4 px-4 flex justify-between items-start mb-2">
                <span className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <h3 className="font-semibold flex-1 ml-2 text-sm md:text-base leading-tight text-right">{item.name}</h3>
              </div>
            )}
            
            <div className={`p-4 ${item.image_url ? 'pt-2' : 'pt-0'}`}>
              {item.image_url && <h3 className="font-semibold text-sm md:text-base leading-tight mb-1 truncate">{item.name}</h3>}
              <p className="text-primary-600 font-bold">₹{item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPanel;
