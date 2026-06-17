import React, { useState } from 'react';
import Input from '../../../components/atoms/input/input';
import Stepper from '../../../components/atoms/stepper/stepper';
import Button from '../../../components/atoms/button/button';
import { api } from '../../../lib/ipc';
import { Table } from '../../../types/models';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  table?: Table;
}

export default function TableModal({ onClose, onSaved, table }: Props) {
  const [name, setName] = useState(table?.name ?? '');
  const [capacity, setCapacity] = useState<number>(table?.capacity ?? 4);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');



  const handleSave = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const cap = capacity;
    if (isNaN(cap) || cap < 1) {
      setError('Capacity must be a positive number');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const payload: Partial<Table> = {
        name: name.trim(),
        capacity: cap,
        section: table?.section ?? 'Main',
      };
      if (table?.id) {
        payload.id = table.id;
      }

      const res = await api.tables.upsert(payload);
      if (res.success) {
        onSaved();
      } else {
        setError(res.error ?? 'Failed to save table');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => { void handleSave(e); }} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <Input
        label="Table Name"
        value={name}
        onChange={(e) => { setName(e.target.value); }}
        placeholder="e.g. T-1, Window 2"
        autoFocus
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Covers)</label>
        <Stepper
          value={capacity}
          onChange={setCapacity}
          min={1}
        />
      </div>

      <div className="-mx-6 -mb-4 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-8">
        <Button variant="ghost" onClick={onClose} disabled={isSaving} type="button">
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSaving}>
          {table ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
