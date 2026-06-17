import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/ipc';
import { InventoryItem } from '../../types/models';
import { InventoryItemModal } from './components/InventoryItemModal';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import Button from '../../components/atoms/button/button';
import { useModal } from '../../hooks/useModal';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleCreate = () => {
    showModal({
      title: "Add Inventory Item",
      content: <InventoryItemModal initialData={null} onClose={hideModal} onRefresh={() => { fetchInventory(); }} />
    });
  };

  const handleEdit = (item: InventoryItem) => {
    showModal({
      title: "Edit Inventory Item",
      content: <InventoryItemModal initialData={item} onClose={hideModal} onRefresh={() => { fetchInventory(); }} />
    });
  };

  const handleAdjust = (item: InventoryItem) => {
    showModal({
      title: `Adjust Stock: ${item.name}`,
      content: <StockAdjustmentModal item={item} onClose={hideModal} onRefresh={() => { fetchInventory(); }} />
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading inventory...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track stock levels, unit costs, and adjustments</p>
        </div>
        <Button
          onClick={() => { handleCreate(); }}
          variant="primary"
        >
          + Add Item
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No inventory items found. Add one to get started.
                </td>
              </tr>
            ) : (
              items.map(item => {
                const isLowStock = item.qty_in_stock <= item.low_stock_alert_at;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.qty_in_stock}
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
      </div>


    </div>
  );
}
