import React, { useState } from 'react';
import { InventoryItem } from '../../../types/models';
import { api } from '../../../lib/ipc';
import Button from '../../../components/atoms/button/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  item: InventoryItem | null;
}

export function StockAdjustmentModal({ isOpen, onClose, onRefresh, item }: Props) {
  const [type, setType] = useState<'purchase' | 'adjustment' | 'wastage'>('purchase');
  const [qtyChange, setQtyChange] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) { return null; }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (qtyChange === '' || qtyChange <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // If wastage or a negative adjustment, quantity should be negative
    let finalQty = qtyChange;
    if (type === 'wastage') {
      finalQty = -finalQty;
    }

    api.inventory.adjust({
      item_id: item.id,
      type,
      qty_change: finalQty,
      note: note.trim() || undefined
    })
      .then(res => {
        if (res.success) {
          onRefresh();
          onClose();
        } else {
          setError(res.error ?? 'Failed to adjust stock');
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
          <h2 className="text-xl font-semibold">Adjust Stock: {item.name}</h2>
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

          <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
            Current Stock: <strong>{item.qty_in_stock} {item.unit}</strong>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
            <select
              value={type}
              onChange={e => { setType(e.target.value as 'purchase' | 'adjustment' | 'wastage'); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="purchase">Purchase (Add Stock)</option>
              <option value="adjustment">Manual Adjustment (Add Stock)</option>
              <option value="wastage">Wastage (Remove Stock)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity {type === 'wastage' ? 'to Remove' : 'to Add'} ({item.unit})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={qtyChange}
              onChange={e => { setQtyChange(e.target.value === '' ? '' : Number(e.target.value)); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 5.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <textarea
              value={note}
              onChange={e => { setNote(e.target.value); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Purchased from local vendor"
              rows={2}
            />
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
              variant={type === 'wastage' ? 'danger' : 'primary'}
              isLoading={isSubmitting}
            >
              Confirm
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
