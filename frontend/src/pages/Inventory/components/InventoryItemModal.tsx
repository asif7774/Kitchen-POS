import { Input, Select } from '../../../components/atoms';
import React, { useState } from 'react';
import { InventoryItem } from '../../../types/models';
import { api } from '../../../lib/ipc';

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

  const { showToast } = useToast();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();


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

        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          showToast({ message: err.message, variant: 'error' });
        } else {
          showToast({ message: String(err), variant: 'error' });
        }

      });
  };

  return (
    <form id="inventory-item-form" onSubmit={handleSubmit} className="space-y-4">
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


    </form>
  );
}
