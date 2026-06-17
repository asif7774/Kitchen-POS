import React, { useState } from 'react';
import { InventoryItem } from '../../../types/models';
import { api } from '../../../lib/ipc';
import Button from '../../../components/atoms/button/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  initialData?: InventoryItem | null;
}

export function InventoryItemModal({ isOpen, onClose, onRefresh, initialData }: Props) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [unit, setUnit] = useState(initialData?.unit ?? 'kg');
  const [lowStockAlertAt, setLowStockAlertAt] = useState<number | ''>(initialData?.low_stock_alert_at ?? 0);
  const [costPerUnit, setCostPerUnit] = useState<number | ''>(initialData?.cost_per_unit ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) { return null; }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      name,
      unit,
      low_stock_alert_at: Number(lowStockAlertAt),
      cost_per_unit: Number(costPerUnit),
    };

    api.inventory.upsertItem(payload)
      .then(res => {
        if (res.success) {
          onRefresh();
          onClose();
        } else {
          setError(res.error ?? 'Failed to save inventory item');
          setIsSubmitting(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
        setIsSubmitting(false);
      });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {initialData ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </h2>
          <Button size="icon" variant="ghost" onClick={() => { onClose(); }} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => { setName(e.target.value); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Tomatoes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
            <select
              value={unit}
              onChange={e => { setUnit(e.target.value); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">Liter (L)</option>
              <option value="ml">ml</option>
              <option value="pcs">Pieces (pcs)</option>
              <option value="pack">Pack</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert Level</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={lowStockAlertAt}
                onChange={e => { setLowStockAlertAt(e.target.value === '' ? '' : Number(e.target.value)); }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={costPerUnit}
                onChange={e => { setCostPerUnit(e.target.value === '' ? '' : Number(e.target.value)); }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => { onClose(); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save Item
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
