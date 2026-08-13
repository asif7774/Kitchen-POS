import { Input, Button } from '../../../components/atoms';
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../lib/ipc';

import { MenuItem } from '../../../types/models';

interface Props {
  menuId: number | null;
  onAddItem: (item: MenuItem) => void;
}

const MenuPanel: React.FC<Props> = ({ menuId, onAddItem }) => {
  const [categories, setCategories] = useState<{id: number; name: string; items: MenuItem[]}[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  const [openOrderVisible, setOpenOrderVisible] = useState(false);
  const [openOrderName, setOpenOrderName] = useState('');
  const [openOrderPrice, setOpenOrderPrice] = useState('');
  const openOrderIdRef = useRef(0);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!menuId) {return;}
      const res = await api.menu.getAll(menuId);
        if (res.success && res.data) {
          setCategories(res.data);
          const allItems = res.data.flatMap((cat: { items?: MenuItem[] }) => cat.items ?? []);
          setItems(allItems);
        }
    };
    void fetchMenu();
  }, [menuId]);

  const displayedItems = activeCategory === null
    ? items
    : categories.find(c => c.id === activeCategory)?.items ?? [];

  const filteredItems = displayedItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesDiet =
      dietFilter === 'all' ||
      (dietFilter === 'veg' && item.is_veg === 1) ||
      (dietFilter === 'non-veg' && item.is_veg === 0);
    return matchesSearch && matchesDiet;
  });

  const handleOpenOrderSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const price = parseFloat(openOrderPrice);
    if (!openOrderName.trim() || isNaN(price) || price <= 0) { return; }
    openOrderIdRef.current = -(Date.now());
    onAddItem({
      id: openOrderIdRef.current,
      category_id: 0,
      name: openOrderName.trim(),
      price,
      is_veg: 0,
    });
    setOpenOrderVisible(false);
    setOpenOrderName('');
    setOpenOrderPrice('');
  };

  const handleOpenOrderClick = () => {
    setOpenOrderName(search.trim());
    setOpenOrderPrice('');
    setOpenOrderVisible(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDietFilter('all'); }}
              className={dietFilter === 'all' ? 'bg-white shadow-sm text-gray-800 hover:bg-white' : 'text-gray-500 hover:text-gray-700'}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDietFilter('veg'); }}
              className={`flex items-center gap-1.5 ${dietFilter === 'veg' ? 'bg-white shadow-sm text-emerald-600 hover:bg-white hover:text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>Veg
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDietFilter('non-veg'); }}
              className={`flex items-center gap-1.5 ${dietFilter === 'non-veg' ? 'bg-white shadow-sm text-rose-600 hover:bg-white hover:text-rose-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm"></span>Non-Veg
            </Button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-2 px-2">
          <Button
            variant={activeCategory === null ? "primary" : "ghost"}
            onClick={() => { setActiveCategory(null); }}
            className={`whitespace-nowrap rounded-full transition-all ${activeCategory !== null ? 'border border-gray-200' : 'shadow-md'}`}
          >
            All Items
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "primary" : "ghost"}
              onClick={() => { setActiveCategory(cat.id); }}
              className={`whitespace-nowrap rounded-full transition-all ${activeCategory !== cat.id ? 'border border-gray-200' : 'shadow-md'}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Open Order strip — shown when search is non-empty */}
      {search.trim() && (
        <button
          type="button"
          className="flex items-center gap-3 px-4 py-3 mb-3 bg-indigo-50 border border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors w-full text-left"
          onClick={handleOpenOrderClick}
        >
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0">+</div>
          <div className="flex-1">
            <p className="font-bold text-indigo-700 text-sm">Open Order</p>
            <p className="text-xs text-indigo-500">Add custom item with any name &amp; price</p>
          </div>
          <span className="text-indigo-400 text-sm font-medium">→</span>
        </button>
      )}

      <div className="flex-1 overflow-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max pb-10">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="group hover-lift cursor-pointer flex flex-col justify-between overflow-hidden relative rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400/50"
            onClick={() => { onAddItem(item); }}
          >
            <div className="w-full h-24 bg-gray-100 relative overflow-hidden border-b border-gray-100">
              <img
                src={item.image_url ? item.image_url.replace('file://', 'local://') : './placeholder.png'}
                alt={item.name}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!item.image_url ? 'opacity-80' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className={`absolute top-2 right-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md z-10 ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </div>

            <div className="p-3 pt-2 flex flex-col z-10 bg-white">
              <h3 className="font-bold text-sm md:text-base leading-tight mb-1 text-gray-800 line-clamp-2">{item.name}</h3>
              <div className="flex justify-between items-end mt-auto">
                <p className="text-emerald-500 font-black text-lg tracking-tight">₹{item.price.toFixed(2)}</p>

                {/* Plus Icon indicating add action */}
                <div className="bg-gray-50 text-gray-400 rounded-full p-1.5 opacity-0 group-hover:opacity-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Open Order modal */}
      {openOrderVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => { setOpenOrderVisible(false); }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={e => { e.stopPropagation(); }}
          >
            <h2 className="text-lg font-bold mb-4 text-gray-900">Open Order</h2>
            <form onSubmit={handleOpenOrderSubmit} className="space-y-4">
              <Input
                label="Item Name"
                value={openOrderName}
                onChange={e => { setOpenOrderName(e.target.value); }}
                placeholder="e.g. Vada Pav"
                autoFocus
                required
              />
              <Input
                label="Price (₹)"
                type="number"
                value={openOrderPrice}
                onChange={e => { setOpenOrderPrice(e.target.value); }}
                placeholder="e.g. 30"
                min="0.01"
                step="any"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => { setOpenOrderVisible(false); }}>Cancel</Button>
                <Button type="submit" variant="primary">Add to Order</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPanel;
