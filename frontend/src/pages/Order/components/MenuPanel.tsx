import { Input } from '../../../components/atoms';
import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/ipc';

import { MenuItem } from '../../../types/models';

interface Props {
  onAddItem: (item: MenuItem) => void;
}

const MenuPanel: React.FC<Props> = ({ onAddItem }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      const res = await api.menu.getAll();
      if (res.success && res.data) {
        const allItems = res.data.flatMap((cat: { items?: MenuItem[] }) => cat.items ?? []);
        setItems(allItems);
      }
    };
    void fetchMenu();
  }, []);

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
      <div className="flex-1 overflow-auto grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-max">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            className="card p-4 hover-lift cursor-pointer flex flex-col justify-between"
            onClick={() => { onAddItem(item); }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${item.is_veg ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <h3 className="font-semibold flex-1 ml-2 text-sm md:text-base leading-tight">{item.name}</h3>
            </div>
            <p className="text-gray-600 font-bold mt-2">₹{item.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPanel;
