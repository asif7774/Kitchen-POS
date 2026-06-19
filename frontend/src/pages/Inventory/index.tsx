import { Button, Autosearch } from '../../components/atoms';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../lib/ipc';
import { InventoryItem } from '../../types/models';
import { InventoryItemModal } from './components/InventoryItemModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { Card } from '../../components/atoms/card';
import { useModal } from '../../hooks/useModal';
import { useHeader } from '../../contexts/HeaderContext';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { showModal, hideModal } = useModal();

  const fetchInventory = useCallback(() => {
    setLoading(true);
    api.inventory.getAll()
      .then(res => {
        if (res.success && res.data) {
          setItems(res.data);
          setError(null);
        } else {
          setError(res.error ?? 'Failed to load inventory');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let active = true;
    api.inventory.getAll().then(res => {
      if (active && res.success && res.data) {
        setItems(res.data);
        setError(null);
      } else if (active) {
        setError(res.error ?? 'Failed to load inventory');
      }
    }).catch((err: unknown) => {
      if (active) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      }
    }).finally(() => {
      if (active) { setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  const handleCreate = useCallback(() => {
    showModal({
      title: "Add Inventory Item",
      content: <InventoryItemModal initialData={null} onClose={hideModal} onRefresh={() => { fetchInventory(); }} />,
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="inventory-item-form" variant="primary">Save Item</Button>
        </>
      )
    });
  }, [showModal, hideModal, fetchInventory]);

  const handleEdit = (item: InventoryItem) => {
    showModal({
      title: "Edit Inventory Item",
      content: <InventoryItemModal initialData={item} onClose={hideModal} onRefresh={() => { fetchInventory(); }} />,
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="inventory-item-form" variant="primary">Save Item</Button>
        </>
      )
    });
  };

  const handleAdjust = (item: InventoryItem) => {
    showModal({
      title: `Adjust Stock: ${item.name}`,
      content: <StockAdjustmentModal item={item} onClose={hideModal} onRefresh={() => { fetchInventory(); }} />,
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="stock-adjust-form" variant="primary">Confirm</Button>
        </>
      )
    });
  };
  const searchOptions = useMemo(() => items.map(item => ({
    value: String(item.id),
    label: item.name
  })), [items]);

  const { setHeader } = useHeader();
  
  useEffect(() => {
    setHeader(
      'Inventory Management',
      <div className="flex items-center space-x-4">
        <div className="w-64">
          <Autosearch
            placeholder="Search inventory items..."
            options={searchOptions}
            value={searchQuery}
            onChange={setSearchQuery}
            onSelectOption={(opt) => { setSearchQuery(opt.label); }}
          />
        </div>
        <Button
          onClick={() => { handleCreate(); }}
          variant="primary"
        >
          + Add Item
        </Button>
      </div>
    );
    return () => { setHeader(null, null); };
  }, [setHeader, searchQuery, searchOptions, handleCreate]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading inventory...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-responsive p-6 mx-auto h-full flex flex-col">
      <Card>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4 text-right">In Stock</th>
              <th className="py-3 px-4 text-right">Cost/Unit</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No inventory items found matching your search.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => {
                const isLowStock = item.qty_in_stock <= item.low_stock_alert_at;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {parseFloat(item.qty_in_stock.toFixed(2))}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      ₹{item.cost_per_unit.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={() => { handleAdjust(item); }}
                          variant="secondary"
                          size="sm"
                        >
                          Adjust Stock
                        </Button>
                        <Button
                          onClick={() => { handleEdit(item); }}
                          variant="outline"
                          size="sm"
                        >
                          Edit Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>


    </div>
  );
}
