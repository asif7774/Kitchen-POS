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
            className="group hover-lift cursor-pointer flex flex-col justify-between overflow-hidden relative rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400/50"
            onClick={() => { onAddItem(item); }}
          >
            {item.image_url ? (
              <div className="w-full h-36 bg-gray-100 relative overflow-hidden">
                <img src={item.image_url.replace('file://', 'local://')} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className={`absolute top-2 right-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md z-10 ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </div>
            ) : (
              <div className="pt-5 px-5 flex justify-between items-start mb-2 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full opacity-50 z-0" />
                <span className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 border-2 border-white shadow-sm z-10 relative ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                <h3 className="font-extrabold flex-1 ml-2 text-sm md:text-base leading-tight text-right text-gray-800 z-10 relative line-clamp-2">{item.name}</h3>
              </div>
            )}
            
            <div className={`p-5 flex flex-col z-10 bg-white ${item.image_url ? 'pt-3' : 'pt-0'}`}>
              {item.image_url && <h3 className="font-bold text-sm md:text-base leading-tight mb-1 text-gray-800 line-clamp-2">{item.name}</h3>}
              <div className="flex justify-between items-end mt-auto">
                <p className="text-blue-600 font-black text-lg tracking-tight">₹{item.price.toFixed(2)}</p>
                
                {/* Plus Icon indicating add action */}
                <div className="bg-gray-50 text-gray-400 rounded-full p-1.5 opacity-0 group-hover:opacity-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPanel;
