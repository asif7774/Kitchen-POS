import React, { useState } from 'react';
import { InventoryItem } from '../../../types/models';
import { api } from '../../../lib/ipc';
import Button from '../../../components/atoms/button/button';
import Input from '../../../components/atoms/input/input';
import Select from '../../../components/atoms/select/select';
import { useToast } from '../../../hooks/useToast';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
  initialData?: InventoryItem | null;
}

export function InventoryItemModal({ onClose, onRefresh, initialData }: Props) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [unit, setUnit] = useState(initialData?.unit ?? 'kg');
  const [lowStockAlertAt, setLowStockAlertAt] = useState<number | ''>(initialData?.low_stock_alert_at ?? 0);
  const [costPerUnit, setCostPerUnit] = useState<number | ''>(initialData?.cost_per_unit ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

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
          showToast({ message: 'Inventory item saved successfully', variant: 'success' });
          onRefresh();
          onClose();
        } else {
          showToast({ message: res.error ?? 'Failed to save inventory item', variant: 'error' });
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
      <Input
        label="Item Name"
        type="text"
        required
        value={name}
        onChange={e => { setName(e.target.value); }}
        placeholder="e.g., Tomatoes"
      />

      <Select
        label="Unit of Measurement"
        value={unit}
        onChange={e => { setUnit(e.target.value); }}
      >
        <option value="kg">kg</option>
        <option value="g">g</option>
        <option value="L">Liter (L)</option>
        <option value="ml">ml</option>
        <option value="pcs">Pieces (pcs)</option>
        <option value="pack">Pack</option>
      </Select>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Low Stock Alert Level"
          type="number"
          min="0"
          step="0.01"
          required
          value={lowStockAlertAt}
          onChange={e => { setLowStockAlertAt(e.target.value === '' ? '' : Number(e.target.value)); }}
        />
        <Input
          label="Cost per Unit (₹)"
          type="number"
          min="0"
          step="0.01"
          required
          value={costPerUnit}
          onChange={e => { setCostPerUnit(e.target.value === '' ? '' : Number(e.target.value)); }}
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
          variant="primary"
          isLoading={isSubmitting}
        >
          Save Item
        </Button>
      </div>
    </form>
  );
}
