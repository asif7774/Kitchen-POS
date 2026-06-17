import React, { useState } from 'react';
import Button from '../../../components/atoms/button/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

const CancelOrderModal: React.FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onConfirm(note);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-red-600">Void Order</h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="text-gray-500">✕</Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 mb-2">
            <p className="font-semibold text-sm">Are you sure you want to void this order?</p>
            <p className="text-xs mt-1">This action cannot be undone. Inventory items deducted via KOT will be automatically restored.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cancellation Reason / Note (Optional)</label>
            <textarea 
              value={note}
              onChange={(e) => { setNote(e.target.value); }}
              placeholder="e.g. Customer walked out, ordered by mistake..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:outline-none min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={onClose} type="button">Go Back</Button>
            <Button variant="danger" type="submit" isLoading={isSubmitting}>
              Confirm Void Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelOrderModal;
