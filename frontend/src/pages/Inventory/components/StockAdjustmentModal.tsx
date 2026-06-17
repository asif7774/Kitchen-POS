import React, { useState } from 'react';
import { InventoryItem } from '../../../types/models';
import { api } from '../../../lib/ipc';
import Button from '../../../components/atoms/button/button';
import Input from '../../../components/atoms/input/input';
import Select from '../../../components/atoms/select/select';
import Textarea from '../../../components/atoms/textarea/textarea';
import { useToast } from '../../../hooks/useToast';

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
  const { showToast } = useToast();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (qtyChange === '' || qtyChange <= 0) {
      showToast({ message: 'Quantity must be greater than 0', variant: 'error' });
      return;
    }

    setIsSubmitting(true);

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
          showToast({ message: 'Stock adjusted successfully', variant: 'success' });
          onRefresh();
          onClose();
        } else {
          showToast({ message: res.error ?? 'Failed to adjust stock', variant: 'error' });
          setIsSubmitting(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          showToast({ message: err.message, variant: 'error' });
        } else {
          showToast({ message: String(err), variant: 'error' });
        }
        setIsSubmitting(false);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-4">
        Current Stock: <strong>{item.qty_in_stock} {item.unit}</strong>
      </div>

      <Select
        label="Adjustment Type"
        value={type}
        onChange={e => { setType(e.target.value as 'purchase' | 'adjustment' | 'wastage'); }}
      >
        <option value="purchase">Purchase (Add Stock)</option>
        <option value="adjustment">Manual Adjustment (Add Stock)</option>
        <option value="wastage">Wastage (Remove Stock)</option>
      </Select>

      <Input
        label={`Quantity ${type === 'wastage' ? 'to Remove' : 'to Add'} (${item.unit})`}
        type="number"
        min="0.01"
        step="0.01"
        required
        value={qtyChange}
        onChange={e => { setQtyChange(e.target.value === '' ? '' : Number(e.target.value)); }}
        placeholder="e.g., 5.5"
      />

      <Textarea
        label="Note (Optional)"
        value={note}
        onChange={e => { setNote(e.target.value); }}
        placeholder="e.g., Purchased from local vendor"
        rows={2}
      />

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
