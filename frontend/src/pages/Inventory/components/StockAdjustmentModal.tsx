import React, { useState } from 'react';
import { InventoryItem } from '../../../types/models';
import { api } from '../../../lib/ipc';
import Button from '../../../components/atoms/button/button';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
  item: InventoryItem;
}

export function StockAdjustmentModal({ onClose, onRefresh, item }: Props) {
  const [type, setType] = useState<'purchase' | 'adjustment' | 'wastage'>('purchase');
  const [qtyChange, setQtyChange] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);



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
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="-mx-6 -mb-4 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-8">
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
  );
}
