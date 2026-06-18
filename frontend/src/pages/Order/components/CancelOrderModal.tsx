import { Textarea } from '../../../components/atoms';
import React, { useState } from 'react';


interface Props {

  onConfirm: (note: string) => void;
}

const CancelOrderModal: React.FC<Props> = ({ onConfirm }) => {
  const [note, setNote] = useState('');




  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    onConfirm(note);
  };

  return (
    <form id="cancel-order-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 mb-2">
        <p className="font-semibold text-sm">Are you sure you want to void this order?</p>
        <p className="text-xs mt-1">This action cannot be undone. Inventory items deducted via KOT will be automatically restored.</p>
      </div>

      <Textarea 
        label="Cancellation Reason / Note (Optional)"
        value={note}
        onChange={(e) => { setNote(e.target.value); }}
        placeholder="e.g. Customer walked out, ordered by mistake..."
        className="focus-visible:ring-red-500 min-h-[80px]"
      />

    </form>
  );
};

export default CancelOrderModal;
